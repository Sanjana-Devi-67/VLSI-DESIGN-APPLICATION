import httpx
import re

AI_ENGINE_URL = "http://localhost:8000"


def has_duplicate_ports(verilog):

    ports = []

    lines = verilog.split("\n")

    for line in lines:
        line = line.strip()

        if line.startswith("input") or line.startswith("output"):
            
            # remove wire/reg
            line = line.replace("wire", "")
            line = line.replace("reg", "")

            parts = line.split()

            if len(parts) >= 2:
                name = parts[-1].replace(",", "")
                ports.append(name)

    return len(ports) != len(set(ports))


async def optimize_verilog(verilog):

    print("Optimizer Running")
    print(verilog)

    if not has_duplicate_ports(verilog):
        print("No duplicates found")
        return {"optimized": verilog}

    print("Duplicates found — fixing")