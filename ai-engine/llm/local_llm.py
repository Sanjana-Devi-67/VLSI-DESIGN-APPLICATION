from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import re

MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

tokenizer = None
model = None


def load_model():
    global tokenizer, model

    if model is None:
        tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

        model = AutoModelForCausalLM.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.float32
        )


def clean_verilog(text):

    # remove markdown blocks
    text = re.sub(r"```verilog", "", text)
    text = re.sub(r"```", "", text)

    # remove explanation before module
    if "module" in text:
        text = text[text.index("module"):]

    # cut after endmodule
    if "endmodule" in text:
        text = text[: text.index("endmodule") + len("endmodule")]

    return text.strip()


def generate_local(prompt):

    load_model()

    input_prompt = f"""
<|system|>
You are an expert VLSI engineer.
Generate ONLY synthesizable Verilog code.
Return only Verilog.

<|user|>
{prompt}

<|assistant|>
"""

    inputs = tokenizer(
        input_prompt,
        return_tensors="pt"
    )

    outputs = model.generate(
        **inputs,
        max_new_tokens=350,
        do_sample=True,
        temperature=0.2,
        top_p=0.9
    )

    result = tokenizer.decode(
        outputs[0],
        skip_special_tokens=True
    )

    result = result.split("<|assistant|>")[-1]

    return clean_verilog(result)