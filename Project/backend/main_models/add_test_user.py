from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.main_models.tables import Base, User 
import bcrypt

# Replace with your actual database URL
DATABASE_URL = "postgresql://postgres:admin@localhost/login_app"

# Create engine and session
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Hash the password before saving
hashed_password = bcrypt.hashpw("admin".encode(), bcrypt.gensalt()).decode()

# Create a new user instance
new_user = User(
    name="Admin",
    email="admin@hotmail.com",
    password=hashed_password,  
    role="admin"
)

# Add and commit the new user to the database
session.add(new_user)
session.commit()

print("User added successfully!")

# Close session
session.close()
