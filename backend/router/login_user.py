from fastapi import APIRouter,status,HTTPException,Depends
from service.request_schema import Login_user_schema
from service.database_table_schema import User_table
from service.database import Session,get_session
from service.password_hash import verify_password
from service.jwt_token import create_access_token
from sqlmodel import select
router=APIRouter()

@router.post("/api/login")
def login_user(request:Login_user_schema,db:Session=Depends(get_session)):
    try:
        user=db.exec(select(User_table).where(User_table.email==request.email)).first()
        #user check
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail={"message":"invalid email"})
        
        #password check
        if verify_password(request.password,user.password) is False:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail={"message":"invalid password"})
        payload={
            "sub":user.user_name,
            "email":user.email,
            "user_id":user.id
        }
        return{
            "message":"login successfull",
            "token":create_access_token(payload)
        }
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail={"error":str(e)})
