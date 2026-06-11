from pydantic import BaseModel
from typing import Literal,Annotated
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
class Chat_state(BaseModel):
    user_id:int
    chat_id:int
    user_query:str
    rag_relevant_docs:list=None
    classification:Literal["RAG","GENERAL"]=None 
    history:Annotated[list[BaseMessage],add_messages]