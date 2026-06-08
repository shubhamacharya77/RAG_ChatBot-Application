from langchain_chroma import Chroma
from langchain_core.documents import Document
from service.models import embedding_model

vectorDB=Chroma(
    collection_name="Documents",
    persist_directory="Documents",
    embedding_function=embedding_model
)