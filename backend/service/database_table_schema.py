from sqlmodel import SQLModel,Field,Relationship
from pydantic import EmailStr
from datetime import datetime, timezone
from typing import List,Optional


# create user table
class User_table(SQLModel,table=True):
    id:int=Field(primary_key=True,description="it will contain the primary key for the user table",index=True)
    user_name:str=Field(description="it will store the user name ")
    email:EmailStr=Field(index=True,description="this column will store the user's email",unique=True)
    password:str=Field(index=True,description="this column will store the user password")
    document:List["Document_table"]=Relationship(back_populates="user")
    chats:List["Chat_table"]=Relationship(back_populates="user")

#create document table
class Document_table(SQLModel,table=True):
    id:int=Field(primary_key=True,description="it will contain the primary key for the document table")
    document:str=Field(index=True,description="it will store the document storage path.....")
    user_id:int=Field(foreign_key="user_table.id")
    user:Optional[User_table] = Relationship( back_populates="document" )

#create chat table 
class Chat_table(SQLModel,table=True):
    chat_id:int=Field(primary_key=True,description="it stores the chat id for each chat")
    chat_title:str=Field(description="it stores the title of the chat",default="New Conversation",unique=True)
    user_id: int = Field(foreign_key="user_table.id",index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    user: Optional["User_table"] = Relationship(back_populates="chats")
    messages:List["Message_table"]=Relationship(back_populates="chat")

#create message table
class Message_table(SQLModel,table=True):
    message_id:int=Field(primary_key=True,)
    message_content:str=Field(description="it stores the actual message content")
    role:str=Field(description="it's store the role of sender")
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    chat_id:int=Field(foreign_key="chat_table.chat_id",index=True)
    chat: Optional["Chat_table"] = Relationship(
        back_populates="messages"
    )