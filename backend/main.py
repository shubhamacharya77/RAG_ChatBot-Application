from fastapi import FastAPI 
from service.database_table_schema import *
from service.database import engine
from router.create_user import router as create_user
from router.delete_user import router as delete_user
from router.login_user import router as login_user
from router.upload_document import router as document_upload 
from router.show_documents import router as show_document
from router.delete_documents import router as delete_document
from router.create_new_chat import router as new_chat
from router.delete_chat import router as delete_chat
from router.chat import router as chat
from router.show_chat_message import router as show_chat_message
from router.show_chats import router as show_chats
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],      # Allow all HTTP methods
    allow_headers=["*"],    # Allow all headers
)
SQLModel.metadata.create_all(engine)

app.include_router(login_user)
app.include_router(create_user)
app.include_router(delete_user)
app.include_router(document_upload)
app.include_router(show_document)
app.include_router(delete_document)
app.include_router(new_chat)
app.include_router(chat)
app.include_router(show_chat_message)
app.include_router(show_chats)
app.include_router(delete_chat)
@app.get("/")
def healthCheck():
    return{
        "message":"server is running !"
    }

