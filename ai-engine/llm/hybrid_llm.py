from llm.local_llm import generate_local
from llm.api_llm import generate_api


def generate_verilog(prompt):

    try:

        print("Using Local LLM")

        return generate_local(prompt)

    except Exception as e:

        print("Local failed — using API")

        return generate_api(prompt)