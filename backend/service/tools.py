from langchain.tools import tool
from tavily import TavilyClient
import os 
@tool
def web_search(request:str):
    """this tool will help you to get information from web-search. and use it for real time information"""
    try:
        tavily_client = TavilyClient(api_key=os.getenv("tavily"))
        response = tavily_client.search(request)
        return response
    except Exception as e:
        raise Exception(str(e))
    

tool_map={
    "web_search":web_search
}