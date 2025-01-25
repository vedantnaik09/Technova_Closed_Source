from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from task_allocator import Tasks
app = FastAPI()

@app.post("/task-allocation")
async def start_interview():
    pass
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)