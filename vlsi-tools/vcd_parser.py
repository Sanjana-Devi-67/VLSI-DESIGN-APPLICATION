import re

def parse_vcd(file_path):

    signals = {}

    with open(file_path) as f:
        lines = f.readlines()

    current_time = 0

    for line in lines:

        if line.startswith("#"):
            current_time = int(line[1:])

        elif line.startswith("0") or line.startswith("1"):

            value = line[0]
            signal = line[1:].strip()

            if signal not in signals:
                signals[signal] = []

            signals[signal].append(value)

    result = []

    for key, values in signals.items():

        result.append({
            "signal": key,
            "values": "".join(values)
        })

    return result