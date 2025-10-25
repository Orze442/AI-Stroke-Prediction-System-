from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pgvector.sqlalchemy import Vector
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String
from sentence_transformers import SentenceTransformer
from llama_cpp import Llama
import threading

DATABASE_URL = "postgresql://postgres:admin@localhost/login_app"
GGUF_MODEL_PATH = "clinical_rag/models/JSL-Med-Phi-3.5-Mini-v3.i1-Q4_K_M.gguf"

Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    content = Column(String)
    source = Column(String)
    embedding = Column(Vector(384))

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda") # Enable GPU by using cuda


llm = Llama(
    model_path=GGUF_MODEL_PATH, 
    n_ctx=4096, 
    n_threads=12, 
    n_gpu_layers=0) #if GPU is used

def semantic_search(query, top_k=3):
    query_emb = model.encode(query).tolist()
    embedding_str = "[" + ",".join(map(str, query_emb)) + "]"

    session = SessionLocal()
    sql = text(f"""
        SELECT content, source FROM documents
        ORDER BY embedding <=> '{embedding_str}'
        LIMIT :limit
    """)
    results = session.execute(sql, {"limit": top_k}).fetchall()
    session.close()

    return [{"content": row[0], "source": row[1]} for row in results]

# Global lock
llm_lock = threading.Lock()

def ask_llm_with_context(user_query: str):
    if not llm_lock.acquire(blocking=False):
        # Someone else is using the LLM right now
        return "The assistant is currently processing another request. Please wait.", []

    try:
        chunks = semantic_search(user_query)

        context = "\n\n".join([f"{doc['content']} (Source: {doc['source']})" for doc in chunks])
        sources = [doc['source'] for doc in chunks]

        prompt = f"""
You are a clinical assistant. Based on the following documents, answer the user's question:

User Prompt: {user_query}

Relevant Documents:
{context}

Answer:
"""

        response = llm(prompt=prompt, temperature=0.2, max_tokens=512)
        return response["choices"][0]["text"].strip(), sources

    finally:
        llm_lock.release()

