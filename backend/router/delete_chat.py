from fastapi import APIRouter,status,HTTPException,Depends
from service.database_table_schema import Chat_table,Message_table
from service.database import Session, get_session
from service.jwt_token import get_current_user
from sqlmodel import select
router=APIRouter()

@router.delete("/api/delete_chat",tags=["Chat"])
def delete_chat(chat_id:int,current_user=Depends(get_current_user),db:Session=Depends(get_session)):
    try:
        deleted_chat = db.exec(
            select(Chat_table).where(Chat_table.chat_id ==chat_id)
        ).first()

        if not deleted_chat:
            raise HTTPException(
                status_code=404,
                detail="No chat found"
            )
        if deleted_chat.user_id != current_user["user_id"]:
            raise HTTPException(
        status_code=403,
        detail="Not allowed to delete this chat"
    )
        # messages deletion 
        deleted_messages = db.exec(
    select(Message_table).where(
        Message_table.chat_id == deleted_chat.chat_id
    )
).all()
        for message in deleted_messages:
            db.delete(message)
        # chat deletion
        db.delete(deleted_chat)
        db.commit()
        return {
            "message": "chat deleted!"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": str(e),
                "message": "chat deletion failed"
            }
        )
