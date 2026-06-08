from fastapi import FastAPI 
from service.database_table_schema import *
from service.database import engine
from router.create_user import router as create_user
from router.delete_user import router as delete_user
from router.login_user import router as login_user
from router.upload_document import router as document_upload 
from router.show_documents import router as show_document
from router.delete_documents import router as delete_document
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/")
def healthCheck():
    return{
        "message":"server is running !"
    }
