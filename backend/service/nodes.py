from service.graph_state import Chat_state
from service.vectorstore import vectorDB
from service.models import chat_model
from service.database import SessionLocal
from service.database_table_schema import Message_table,Chat_table
from sqlmodel import select
from service.prompt import rag_response_prompt,general_response_prompt,decision_prompt
from langchain_core.messages import HumanMessage,AIMessage


def rag_search(state:Chat_state):
    try:
        retrive_docs=vectorDB.similarity_search_with_score(
            query=state.user_query,
            k=3,
            filter={
            "user_id":state.user_id
            }
        )
        contents = [doc.page_content for doc, score in retrive_docs]
        message=HumanMessage(content=state.user_query)
        message_saver_in_DB(message.content,message.type,state.chat_id)
        return{
            "rag_relevant_docs":contents,
            "history":[message]
        }
    except Exception as e: 
        raise Exception(str(e))
    


def check_rag_retrival(state:Chat_state):
    try:
        prompt=decision_prompt(docs=state.rag_relevant_docs,query=state.user_query)
        decision=chat_model.invoke(prompt)
        if "RAG" in decision.content:
            return {"classification": "RAG"}
        else:
            return {"classification": "GENERAL"}

    except Exception as e:
        raise Exception(str(e))


def router_method(state:Chat_state):
    try:
        if state.classification =="RAG":
            return "RAG_NODE"
        else:
            return "GENERAL_NODE"
    except Exception as e:
        raise Exception(str(e))

def general_response(state: Chat_state):
    try:
        recent_history = state.history[-10:]
        prompt=general_response_prompt(recent_history)
        response = chat_model.invoke(prompt)
        message=AIMessage(content=response.content)
        message_saver_in_DB(message.content,message.type,state.chat_id)
        return {
                "history": [message]
                
            }

    
    except Exception as e:
        raise Exception(str(e))

def rag_response(state:Chat_state):
    try:
        recent_history = state.history[-10:]
        prompt=rag_response_prompt(state.rag_relevant_docs,recent_history)
        response=chat_model.invoke(prompt)
        message=AIMessage(content=response.content)
        message_saver_in_DB(message.content,message.type,state.chat_id)
        return{
            "history":[message]
        }
    except Exception as e:
        raise Exception(str(e))
    



def message_saver_in_DB( content:str,role:str,chat_id:int):
    try:
        db=SessionLocal()
        new_message=Message_table(
            message_content=content,
            role=role,
            chat_id=chat_id
        )  
        chat=db.execute(select(Chat_table).where(Chat_table.chat_id==chat_id)).scalars().first()
        if chat and chat.chat_title=="New Conversation":
            chat.chat_title = content 
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        return{
            "message":"message stored !"
        }
    except Exception as e:
        raise Exception(str(e))