from sqlmodel import Session,create_engine

DATA_BASE_URL="postgresql+psycopg://postgres:root@localhost:5432/AuraChat"

engine=create_engine(DATA_BASE_URL)

def get_session():
    with Session(engine) as session:
        yield session