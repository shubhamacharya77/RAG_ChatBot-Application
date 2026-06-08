from sqlmodel import SQLModel,Field,Relationship
from pydantic import EmailStr
from typing import Optional
# create user table
class User_table(SQLModel,table=True):
    ...
    id:int=Field(primary_key=True,description="it will contain the primary key for the user table",index=True)
    user_name:str=Field(description="it will store the user name ")
    email:EmailStr=Field(index=True,description="this column will store the user's email",unique=True)
    password:str=Field(index=True,description="this column will store the user password")
    document:Optional["Document_table"]=Relationship(back_populates="user")

class Document_table(SQLModel,table=True):
    ...
    id:int=Field(primary_key=True,description="it will contain the primary key for the document table")
    document:str=Field(index=True,description="it will store the document storage path.....")
    user_id:int=Field(foreign_key="user_table.id")
    user: Optional[User_table] = Relationship( back_populates="document" )
