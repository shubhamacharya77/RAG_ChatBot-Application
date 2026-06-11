from fastapi import APIRouter,status,HTTPException,Depends
from service.jwt_token import get_current_user
from service.database_table_schema import Chat_table,Message_table
from service.database import Session,get_session
from sqlmodel import select
router=APIRouter()

@router.post("/api/show_message", tags=["Chat"])
def show_chat_message(
    chat_id: int,
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    try:
        chat = db.exec(
            select(Chat_table).where(
                Chat_table.chat_id == chat_id,
                Chat_table.user_id == current_user["user_id"]
            )
        ).first()

        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Chat not found"}
            )

        messages = db.exec(
            select(Message_table)
            .where(Message_table.chat_id == chat_id)
            .order_by(Message_table.created_at)
        ).all()

        return {
            "messages": messages
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e)}
        )