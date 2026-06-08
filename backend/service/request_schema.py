from pydantic import BaseModel,EmailStr

class Create_user_schema(BaseModel):
    username:str
    email:EmailStr
    password:str

class Login_user_schema(BaseModel):
    email:EmailStr
    password:str

class Delete_user_schema(BaseModel):
    password:str

class Classification_schema(BaseModel):
    classification:str
    
class Token(BaseModel):
    access_token: str
    token_type: str
    
class TokenData(BaseModel):
    username: str | None = None
    scopes: list[str] = []