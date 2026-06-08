from fastapi import APIRouter,status,HTTPException,Depends
from service.database import Session, get_session
from service.database_table_schema import Document_table
from service.jwt_token import get_current_user
from sqlmodel import select
router=APIRouter()

@router.get("/api/show_documents")
def show_documents(current_user=Depends(get_current_user),db:Session=Depends(get_session)):
    try:
        documents=db.exec(select(Document_table).where(Document_table.user_id==current_user["user_id"])).all()
        return{
            "documents":documents,
        }
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail={"error":str(e)})
