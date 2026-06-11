from fastapi import APIRouter,status,HTTPException,Depends
from service.database_table_schema import Chat_table
from service.jwt_token import get_current_user
from service.database import Session,get_session
router=APIRouter()

@router.get("/api/new_chat",tags=["Chat"])
def create_new_chat(db:Session=Depends(get_session),current_user=Depends(get_current_user)):
    try:    
            new_chat=Chat_table(
                 chat_title="New Conversation",
                 user_id=current_user["user_id"]
            )
            db.add(new_chat)
            db.commit()   # required
            db.refresh(new_chat)
            return{
                  "message": "new chat created !"
            }
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail={"error":str(e)})
