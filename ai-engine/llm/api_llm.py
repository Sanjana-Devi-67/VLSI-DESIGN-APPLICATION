from groq import Groq
import os
import re

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def is_valid_verilog(code):

    if "module" not in code:
        return False

    if "endmodule" not in code:
        return False

    # Must have at least logic
    if "always" not in code and "assign" not in code:
        return False

    # Non synthesizable / invalid
    invalid_patterns = [
        "rule",
        "endrule",
        "Reg#",
        "Bit#",
        "mkReg",
        "initial",
        "$display",
        "$finish",
        "fork",
        "join"
    ]

    for word in invalid_patterns:
        if word in code:
            return False

    return True


def clean_verilog(text):

    text = re.sub(r"```.*?```", "", text, flags=re.S)

    if "module" in text:
        text = text[text.index("module"):]

    if "endmodule" in text:
        text = text[: text.index("endmodule") + len("endmodule")]

    return text.strip()


def fix_verilog(code, prompt):

    fix_prompt = f"""
Fix the following Verilog code.

Requirements:
- Must be synthesizable
- Must compile
- Remove simulation constructs
- Correct syntax errors
- Keep same functionality

Design requirement:
{prompt}

Verilog Code:
{code}

Return only corrected Verilog.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an expert VLSI engineer fixing Verilog code."
            },
            {
                "role": "user",
                "content": fix_prompt
            }
        ]
    )

    return clean_verilog(
        response.choices[0].message.content
    )


def generate_api(prompt):

    strong_prompt = f"""
Generate synthesizable Verilog.

Rules:
- Synthesizable Verilog only
- Must compile
- No simulation constructs
- No explanation

Design:
{prompt}

Return only Verilog.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are an expert VLSI engineer generating synthesizable Verilog."
            },
            {
                "role": "user",
                "content": strong_prompt
            }
        ]
    )

    result = clean_verilog(
        response.choices[0].message.content
    )

    # If invalid → auto fix
    if not is_valid_verilog(result):

        result = fix_verilog(result, prompt)

    # Final check
    if not is_valid_verilog(result):

        # Last retry
        result = fix_verilog(result, prompt)

    return result