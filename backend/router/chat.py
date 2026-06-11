from fastapi import APIRouter,status,HTTPException,Depends
from service.jwt_token import get_current_user
from service.graph import workflow
from service.request_schema import chat_schema
router=APIRouter()

@router.post("/api/chat",tags=["Chat"])
def chat(request:chat_schema,current_user=Depends(get_current_user)):
    try:
        config={
            "configurable": {
        "thread_id": request.chat_id
    }
        }
        resposne=workflow.invoke({
            "user_id":current_user["user_id"],
            "chat_id":request.chat_id,
            "user_query":request.query,
        },config=config)
        last_answer = next((msg.content
            for msg in reversed(resposne["history"])
            if msg.type == "ai"),None)
        return {
    "answer": last_answer
}
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail={"error":str(e)})
