from fastapi import FastAPI
from pydantic import BaseModel

from llm.hybrid_llm import generate_verilog

app = FastAPI(
    title="QANTYX AI Engine"
)


class DesignRequest(BaseModel):
    prompt: str


@app.get("/")
def home():

    return {
        "service": "AI Engine Running"
    }


@app.post("/generate")
async def generate(request: DesignRequest):

    result = generate_verilog(
        request.prompt
    )

    return {
        "verilog": result
    }


@app.get("/health")
def health():

    return {
        "status": "ok"
    }

@app.post("/fix")
def fix(data: dict):

    verilog = data["verilog"]

    from llm.api_llm import fix_verilog

    fixed = fix_verilog(
        verilog,
        "Fix synthesizable verilog"
    )

    return {
        "optimized": fixed
    }