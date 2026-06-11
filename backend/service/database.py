from sqlmodel import Session,create_engine
from sqlalchemy.orm import sessionmaker
DATA_BASE_URL="postgresql://postgres:root@localhost:5432/AuraChat"
engine=create_engine(DATA_BASE_URL)

def get_session():
    with Session(engine) as session:
        yield session


SessionLocal = sessionmaker(bind=engine)