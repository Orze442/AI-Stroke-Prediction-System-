import os
import fitz  # PyMuPDF
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pgvector.sqlalchemy import Vector
from sentence_transformers import SentenceTransformer

# Config
DATABASE_URL = "postgresql://postgres:admin@localhost/login_app"
PDF_PATH = r"documents/Stroke_causes_and_Clinical_Features.pdf"

# DB setup
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True)
    content = Column(String)
    source = Column(String)  # ✅ Add source field
    embedding = Column(Vector(384))  # 384 for MiniLM

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)

# Text utils
def extract_text_from_pdf(path):
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)

def chunk_text(text, chunk_size=500, overlap=100):
    return [text[i:i + chunk_size] for i in range(0, len(text), chunk_size - overlap)]

# Embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Store in PGVector
def store_chunks_to_pgvector(chunks, source_name):
    session = SessionLocal()
    for chunk in chunks:
        embedding = model.encode(chunk).tolist()
        doc = Document(content=chunk, source=source_name, embedding=embedding)
        session.add(doc)
    session.commit()
    session.close()

# Run once per document
if __name__ == "__main__":
    if not os.path.exists(PDF_PATH):
        print(f"PDF not found: {PDF_PATH}")
        exit()

    source_name = os.path.basename(PDF_PATH)  # e.g. CPG_Management_of_Ischaemic_Stroke_3rd_Edition_2020_28.02_.2021_.pdf
    text = extract_text_from_pdf(PDF_PATH)
    chunks = chunk_text(text)
    store_chunks_to_pgvector(chunks, source_name)
    print(f"✅ Document '{source_name}' indexed to pgvector.")

