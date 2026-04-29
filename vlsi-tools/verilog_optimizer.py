import re

# =========================================================
# METRICS ENGINE
# =========================================================

def analyze_verilog(verilog):
    """Count gates based on actual operators in assign/always statements."""
    code = re.sub(r'//.*', '', verilog)
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)

    assigns = re.findall(r'assign\s+\w+\s*=\s*(.+?);', code)
    always_bodies = re.findall(r'always\s*@[^)]*\)\s*(?:begin)?([\s\S]*?)(?:end|endmodule)', code)

    all_expr = ' '.join(assigns) + ' '.join(always_bodies)

    and_ops = len(re.findall(r'&', all_expr))
    or_ops = len(re.findall(r'\|', all_expr))
    xor_ops = len(re.findall(r'\^', all_expr))
    not_ops = len(re.findall(r'~', all_expr))
    add_ops = len(re.findall(r'\+', all_expr))
    sub_ops = len(re.findall(r'-', all_expr))
    mul_ops = len(re.findall(r'\*', all_expr))

    gate_count = and_ops + or_ops + xor_ops + not_ops + (add_ops * 8) + (sub_ops * 8) + (mul_ops * 32)
    gate_count = max(gate_count, 1)

    line_count = len([l for l in verilog.split("\n") if l.strip()])

    return {
        "gate_count": gate_count,
        "estimated_area": round(gate_count * 1.5, 2),
        "estimated_delay": round(max(0.1, gate_count * 0.05), 2),
        "line_count": line_count
    }


# =========================================================
# BOOLEAN SIMPLIFICATION
# =========================================================

def logic_simplify(verilog):

    verilog = re.sub(r'(\w+)\s*\^\s*\1', "1'b0", verilog)
    verilog = re.sub(r'(\w+)\s*&\s*\1', r'\1', verilog)
    verilog = re.sub(r'(\w+)\s*\|\s*\1', r'\1', verilog)
    verilog = re.sub(r"(\w+)\s*&\s*1'b1", r'\1', verilog)
    verilog = re.sub(r"(\w+)\s*\|\s*1'b0", r'\1', verilog)
    verilog = re.sub(r"(\w+)\s*&\s*1'b0", "1'b0", verilog)
    verilog = re.sub(r"(\w+)\s*\|\s*1'b1", "1'b1", verilog)
    verilog = re.sub(r"(\w+)\s*\^\s*1'b0", r'\1', verilog)

    return verilog


# =========================================================
# CSE (Common Subexpression Elimination)
# =========================================================

def cse_optimize(verilog):
    assigns = re.findall(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', verilog)
    if len(assigns) < 2:
        return verilog

    outputs = set(re.findall(r'output\s+(?:wire\s+)?(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', verilog))
    expr_to_first = {}
    replacements = {}

    for var, expr in assigns:
        expr_clean = expr.strip()
        if expr_clean in expr_to_first:
            first = expr_to_first[expr_clean]
            if first != var and var not in outputs:
                replacements[var] = first
        else:
            expr_to_first[expr_clean] = var

    for dup, orig in replacements.items():
        verilog = re.sub(
            r'assign\s+' + re.escape(dup) + r'\s*=\s*.+?;\s*\n?',
            '', verilog
        )
        _d = dup
        _o = orig
        def _repl(m, d=_d, o=_o):
            lhs = m.group(1)
            rhs = m.group(2)
            rhs = re.sub(r'\b' + re.escape(d) + r'\b', o, rhs)
            return 'assign ' + lhs + ' = ' + rhs + ';'
        verilog = re.sub(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', _repl, verilog)

    return verilog


# =========================================================
# COPY PROPAGATION
# =========================================================

def copy_propagation(verilog):
    assigns = re.findall(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', verilog)
    outputs = set(re.findall(r'output\s+(?:wire\s+)?(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', verilog))

    for var, expr in assigns:
        expr_clean = expr.strip()
        if re.match(r'^[a-zA-Z_]\w*$', expr_clean) and expr_clean != var and var not in outputs:
            verilog = re.sub(
                r'assign\s+' + re.escape(var) + r'\s*=\s*' + re.escape(expr_clean) + r'\s*;\s*\n?',
                '', verilog
            )
            _v = var
            _e = expr_clean
            def _repl(m, v=_v, e=_e):
                lhs = m.group(1)
                rhs = m.group(2)
                rhs = re.sub(r'\b' + re.escape(v) + r'\b', e, rhs)
                return 'assign ' + lhs + ' = ' + rhs + ';'
            verilog = re.sub(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', _repl, verilog)

    return verilog


# =========================================================
# EXPRESSION EQUIVALENCE
# =========================================================

def expr_equivalence(verilog):
    assigns = re.findall(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', verilog)
    var_to_expr = {var: expr.strip() for var, expr in assigns}

    for var, expr in assigns:
        expr_clean = expr.strip()
        m = re.match(r'^(\w+)\s*\^\s*(\w+)$', expr_clean)
        if m:
            a, b = m.group(1), m.group(2)
            ea = var_to_expr.get(a, a)
            eb = var_to_expr.get(b, b)
            if ea == eb:
                verilog = re.sub(
                    r'assign\s+' + re.escape(var) + r'\s*=\s*' + re.escape(a) + r'\s*\^\s*' + re.escape(b) + r'\s*;',
                    "assign " + var + " = 1'b0;",
                    verilog
                )

    return verilog


# =========================================================
# DEAD CODE ELIMINATION
# =========================================================

def dead_code_elim(verilog):
    assigns = re.findall(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', verilog)
    if len(assigns) < 2:
        return verilog

    outputs = set(re.findall(r'output\s+(?:wire\s+)?(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', verilog))

    for var, expr in assigns:
        if var in outputs:
            continue
        other_code = re.sub(r'assign\s+' + re.escape(var) + r'\s*=\s*.+?;', '', verilog)
        uses = re.findall(r'\b' + re.escape(var) + r'\b', other_code)
        if len(uses) == 0:
            verilog = re.sub(r'assign\s+' + re.escape(var) + r'\s*=\s*.+?;\s*\n?', '', verilog)
            verilog = re.sub(r'wire\s+' + re.escape(var) + r'\s*;\s*\n?', '', verilog)

    return verilog


# =========================================================
# ADD CLK + RESET (SMART)
# =========================================================

def add_clk_reset(verilog):

    inputs = re.findall(r'input\s+(\w+)', verilog)

    has_clk = any("clk" in i.lower() for i in inputs)
    has_reset = any("rst" in i.lower() or "reset" in i.lower() for i in inputs)

    insert_ports = ""

    if not has_clk:
        insert_ports += "input clk,\n    "
    if not has_reset:
        insert_ports += "input reset,\n    "

    if insert_ports:
        verilog = re.sub(
            r'module\s+(\w+)\s*\(',
            f'module \\1(\n    {insert_ports}',
            verilog
        )

    return verilog


# =========================================================
# REMOVE DUPLICATE PORTS
# =========================================================

def remove_duplicate_ports(verilog):

    lines = verilog.split("\n")
    seen = set()
    result = []

    for line in lines:
        stripped = line.strip()

        if stripped.startswith("input") or stripped.startswith("output"):
            if stripped in seen:
                continue
            seen.add(stripped)

        result.append(line)

    return "\n".join(result)


# =========================================================
# MAIN OPTIMIZER
# =========================================================

def optimize_verilog(verilog):

    original = verilog

    # BEFORE metrics
    before = analyze_verilog(verilog)

    # OPTIMIZATION PIPELINE
    optimized = verilog
    optimized = logic_simplify(optimized)
    optimized = cse_optimize(optimized)
    optimized = copy_propagation(optimized)
    optimized = expr_equivalence(optimized)
    optimized = dead_code_elim(optimized)
    optimized = add_clk_reset(optimized)
    optimized = remove_duplicate_ports(optimized)

    # AFTER metrics
    after = analyze_verilog(optimized)

    def pct(b, a):
        return round(((b - a) / b) * 100, 1) if b else 0

    return {
        "before": before,
        "after": after,
        "improvement": {
            "gate_reduction": pct(before["gate_count"], after["gate_count"]),
            "area_reduction": pct(before["estimated_area"], after["estimated_area"]),
            "delay_reduction": pct(before["estimated_delay"], after["estimated_delay"]),
        },
        "optimized": optimized,
        "optimizations_applied": 1
    }