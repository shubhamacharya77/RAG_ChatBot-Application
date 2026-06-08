from service.graph_state import Chat_state


def router_method(state:Chat_state):
    try:
        if state.classification =="RAG":
            return "RAG"
        else:
            return "GENERAL"
    except Exception as e:
        raise Exception(str(e))

def classification(state:Chat_state):
    try:
        pass 
    except Exception as e: 
        raise Exception(str(e))
