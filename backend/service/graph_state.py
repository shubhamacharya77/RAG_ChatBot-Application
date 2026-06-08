from pydantic import BaseModel
from typing import Literal

class Chat_state(BaseModel):
    user_query:str
    classification:Literal["RAG","GENERAL"]
    General_response:str
    Rag_resposne:str