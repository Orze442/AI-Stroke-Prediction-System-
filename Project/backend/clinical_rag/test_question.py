from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from pgvector.sqlalchemy import Vector
from llama_cpp import Llama
from sentence_transformers import SentenceTransformer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, String

# Config
DATABASE_URL = "postgresql://postgres:admin@localhost/login_app"
GGUF_MODEL_PATH = "models/JSL-Med-Phi-3.5-Mini-v3.i1-Q4_K_M.gguf"  # Use forward slashes for cross-platform safety

# DB setup
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    content = Column(String)
    embedding = Column(Vector(384))

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Load embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def semantic_search(query, top_k=3):
    query_emb = model.encode(query).tolist()

    # Convert the list to PostgreSQL array format directly inside the query
    embedding_str = "[" + ",".join([str(x) for x in query_emb]) + "]"

    session = SessionLocal()
    sql = text(f"""
        SELECT content
        FROM documents
        ORDER BY embedding <=> '{embedding_str}'
        LIMIT :limit
    """)
    result = session.execute(sql, {"limit": top_k}).fetchall()
    session.close()
    return [row[0] for row in result]

# Load LLM
llm = Llama(
    model_path=GGUF_MODEL_PATH,
    n_ctx=4096,
    n_threads=8,
    n_gpu_layers=0,  # CPU-only
)

def ask_llm(prompt):
    result = llm(prompt=prompt, temperature=0.2, max_tokens=512)
    return result["choices"][0]["text"].strip()

# Ask questions without reprocessing
if __name__ == "__main__":
    user_query = input("💬 Enter your clinical question: ")

    print("🔍 Searching relevant chunks...")
    top_chunks = semantic_search(user_query)
    context = "\n\n".join(top_chunks)

    prompt = f"""
You are a clinical assistant. Based on the following documents, answer the user's question:

User Question: {user_query}

Relevant Documents:
{context}

Answer:
"""

    print("🤖 Answering with local LLM...\n")
    answer = ask_llm(prompt)
    print("🧠 LLM Response:\n", answer)

