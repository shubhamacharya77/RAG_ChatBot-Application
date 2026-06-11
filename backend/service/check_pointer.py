from langgraph.checkpoint.postgres import PostgresSaver
from service.database import DATA_BASE_URL

_cm = PostgresSaver.from_conn_string(DATA_BASE_URL)
checkpointer = _cm.__enter__()

checkpointer.setup()