from fastapi import APIRouter,status,HTTPException,Depends
from service.request_schema import Create_user_schema
from service.database_table_schema import User_table
from service.database import Session,get_session
from service.password_hash import hash_password
from sqlmodel import select
router=APIRouter()

@router.post("/api/register")
def create_user(request:Create_user_schema,db:Session=Depends(get_session)):
    try:    
            existing_user = db.exec(select(User_table).where(User_table.email == request.email)).first()
            if existing_user:
                raise HTTPException(status_code=400,detail="Email already exists")
            new_user=User_table(
                user_name=request.username,
                email=request.email,
                password=hash_password(request.password)
            )
            db.add(new_user)
            db.commit()   # required
            db.refresh(new_user)
            return{
                  "message": "Register successful"

            }
    except Exception as e: 
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail={"error":str(e)})
