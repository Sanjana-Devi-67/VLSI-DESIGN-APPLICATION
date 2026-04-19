from llm.local_llm import generate_local
from llm.api_llm import generate_api


def generate_verilog(prompt):

    try:

        print("Using Groq API")

        return generate_api(prompt)

    except Exception as e:

        print("API failed — using Local")

        return generate_local(prompt)