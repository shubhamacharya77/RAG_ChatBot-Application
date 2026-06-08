from langchain_groq import ChatGroq 
from langchain_huggingface import ChatHuggingFace,HuggingFaceEndpoint,HuggingFaceEmbeddings
from service.request_schema import Classification_schema
from service.tools import *
from dotenv import load_dotenv
load_dotenv()
primary_llm=ChatGroq(
    model=os.getenv("groq_chat_model"),
    api_key=os.getenv("GROQ_API_KEY")
)

secondary_llm=HuggingFaceEndpoint(
     repo_id="Qwen/Qwen2.5-7B-Instruct",
     task="text-generation",
     huggingfacehub_api_token=os.getenv("HUGGING_FACE")
 )
secondary_chatmodel=ChatHuggingFace(llm=secondary_llm).bind_tools([web_search])

primary_chat_model=primary_llm.bind_tools([web_search])

classification_model=primary_llm.with_structured_output(Classification_schema)

chatmodel=primary_chat_model.with_fallbacks([secondary_chatmodel])

embedding_model=None
HuggingFaceEmbeddings(
    model=os.getenv("huggingface_embedding_model")
 )