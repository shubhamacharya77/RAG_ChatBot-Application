from langgraph.graph import StateGraph, END, START
from service.graph_state import Chat_state
from service.check_pointer import checkpointer
from service.nodes import *

graph=StateGraph(Chat_state)

# nodes
graph.add_node("rag_node",rag_search)
graph.add_node("check_rag_retrival",check_rag_retrival)
graph.add_node("general_response",general_response)
graph.add_node("rag_response",rag_response)

graph.add_edge(START,"rag_node")
graph.add_edge("rag_node","check_rag_retrival")
graph.add_conditional_edges("check_rag_retrival",router_method,{"RAG_NODE":"rag_response","GENERAL_NODE":"general_response"})
graph.add_edge("general_response",END)
graph.add_edge("rag_response",END)
workflow = graph.compile(checkpointer=checkpointer)
