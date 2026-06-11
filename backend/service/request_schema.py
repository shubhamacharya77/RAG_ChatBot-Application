from pydantic import BaseModel,EmailStr
from typing import Optional,Literal
class Create_user_schema(BaseModel):
    username:str
    email:EmailStr
    password:str

class Login_user_schema(BaseModel):
    email:EmailStr
    password:str

class Delete_user_schema(BaseModel):
    password:str

    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    username: str | None = None
    scopes: list[str] = []
   
class chat_schema(BaseModel):
    query:str
    chat_id:int
