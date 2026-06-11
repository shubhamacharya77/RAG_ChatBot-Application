from fastapi import APIRouter,status,HTTPException,Depends
from service.jwt_token import get_current_user
from service.database_table_schema import Chat_table
from service.database import Session,get_session
from sqlmodel import select
router=APIRouter()

@router.get("/api/show_chats", tags=["Chat"])
def show_chats(
    db: Session = Depends(get_session),
    current_user=Depends(get_current_user)
):
    try:
        chats = db.exec(
            select(Chat_table)
            .where(Chat_table.user_id == current_user["user_id"])
            .order_by(Chat_table.created_at)
        ).all()
        if not chats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"message": "Chats not found"}
            )
        return {
            "chats": chats
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={"error": str(e)}
        )