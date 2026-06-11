from fastapi import APIRouter,status,HTTPException,Depends
from service.database_table_schema import Document_table
from service.database import Session, get_session
from service.jwt_token import get_current_user
from service.vectorstore import vectorDB
from sqlmodel import select
import os 
router=APIRouter()

@router.delete("/api/delete_document",tags=["Document"])
def delete_document(document_id:int,current_user=Depends(get_current_user),db:Session=Depends(get_session)):
    try:
        deleted_document = db.exec(
            select(Document_table).where(Document_table.id == document_id)
        ).first()

        if not deleted_document:
            raise HTTPException(
                status_code=404,
                detail="No document found"
            )

        if deleted_document.user_id != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="Not allowed to delete this document"
            )
        #vector store deletion 
        vectorDB.delete(where={"document_id":deleted_document.id})
        #database deletion 
        db.delete(deleted_document)
        db.commit()

        # local deletion
        path=f"media/{deleted_document.document}"
        if os.path.exists(path):
            os.remove(path)
        return {
            "message": "document deleted!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": str(e),
                "message": "document deletion failed"
            }
        )
