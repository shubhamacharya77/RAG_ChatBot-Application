from fastapi import APIRouter,status,HTTPException,Depends
from service.request_schema import Delete_user_schema
from service.database_table_schema import User_table,Document_table
from service.password_hash import verify_password
from service.database import Session, get_session
from service.vectorstore import vectorDB 
from sqlmodel import select
from service.jwt_token import get_current_user
import os
router=APIRouter()

@router.delete("/api/delete_user",tags=["User"])
def delete_user(request:Delete_user_schema,db:Session=Depends(get_session),current_user=Depends(get_current_user)):
    try:
        user=db.exec(select(User_table).where(User_table.email==current_user["email"])).first()
        #user check
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid email"})
        
        #password check
        if verify_password(request.password,user.password) is False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail={"message":"invalid password"})
        else:
            documents=db.exec(select(Document_table).where(Document_table.user_id==current_user["user_id"])).all()
            for document in documents:
                #local delete
                path=f"media/{document.document}"
                if os.path.exists(path):
                    os.remove(path)
                #vector store delete 
                vectorDB.delete(where={"document_id":document.id})
                # database delete 
                db.delete(document)

            db.delete(user)
            db.commit()
        return{
            "message":"user deleted !",
        }
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail={"error":str(e)})
