from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from service.database import Session, get_session
from service.jwt_token import get_current_user
from service.database_table_schema import Document_table
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from service.vectorstore import vectorDB

router = APIRouter()


@router.post("/api/upload_document",tags=["Document"])
async def upload_documents(
    document: UploadFile = File(...),
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    try:
        # 1. Save file locally
        path = f"media/{document.filename}"

        with open(path, "wb") as buffer:
            buffer.write(await document.read())

        # 2. Save metadata in DB
        document_in_db = Document_table(
            document=document.filename,
            user_id=current_user["user_id"]
        )

        db.add(document_in_db)
        db.commit()
        db.refresh(document_in_db)

        doc_id = document_in_db.id

        if not doc_id:
            raise HTTPException(
                status_code=500,
                detail="Document ID not generated"
            )
        # 3. Load document
        loader = PyMuPDFLoader(path)
        docs = loader.load()

        # 4. Split into chunks
        chunker = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=150
        )

        chunks = chunker.split_documents(docs)

        # 5. Add metadata
        for index, chunk in enumerate(chunks):
            chunk.metadata.update({
                "user_id": current_user["user_id"],
                "document_id": doc_id,
                "chunk_index": index
            })

        # 6. Store in vector DB
        vectorDB.add_documents(chunks)

        return {
            "message": "document uploaded!",
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": str(e),
                "message": "document upload unsuccessful"
            }
        )