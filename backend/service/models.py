from langchain_groq import ChatGroq 
from langchain_huggingface import ChatHuggingFace,HuggingFaceEndpoint,HuggingFaceEmbeddings
import os 
from dotenv import load_dotenv
load_dotenv()
primary_chat_model=ChatGroq(
    model=os.getenv("groq_chat_model"),
    api_key=os.getenv("GROQ_API_KEY")
)

secondary_llm=HuggingFaceEndpoint(
     repo_id="Qwen/Qwen2.5-7B-Instruct",
     task="text-generation",
     huggingfacehub_api_token=os.getenv("HUGGING_FACE")
 )
secondary_chat_model=ChatHuggingFace(llm=secondary_llm)
chat_model=primary_chat_model.with_fallbacks([secondary_chat_model])

embedding_model=HuggingFaceEmbeddings(
    model=os.getenv("huggingface_embedding_model")
 )