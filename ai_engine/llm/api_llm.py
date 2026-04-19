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

    if "always" not in code and "assign" not in code:
        return False

    # Check duplicate inputs
    inputs = re.findall(r"input\s+\w+", code)

    if len(inputs) != len(set(inputs)):
        return False

    # Check duplicate outputs
    outputs = re.findall(r"output\s+\[?.*?\]?\s*\w+", code)

    if len(outputs) != len(set(outputs)):
        return False

    # invalid constructs
    invalid_patterns = [
        "rule",
        "endrule",
        "Reg#",
        "Bit#",
        "mkReg",
        "$display",
        "$finish"
    ]

    for word in invalid_patterns:
        if word in code:
            return False

    return True
    
def clean_verilog(text):

    # remove markdown
    text = re.sub(r"```verilog", "", text, flags=re.I)
    text = re.sub(r"```", "", text)

    # extract module to endmodule
    match = re.search(
        r"(module[\s\S]*?endmodule)",
        text,
        re.IGNORECASE
    )

    if match:
        return match.group(1).strip()

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
        temperature=0.0,
        top_p=1.0,
        max_tokens=1024,
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
- No duplicate ports
- Do not repeat clock or reset signals
- Use only one reset signal
- Use non-blocking assignments (<=) in sequential logic
- Remove unused inputs
- Clean RTL design

Design:
{prompt}

Return only Verilog.
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.0,
        top_p=1.0,
        max_tokens=1024,
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