import re
import numpy as np

try:
    from qiskit.circuit.library import QAOAAnsatz
    from qiskit.quantum_info import SparsePauliOp
    from qiskit_aer import AerSimulator
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False


# ========================== METRICS ==========================

def analyze_verilog(verilog):
    """Count gates based on actual operators in assign/always statements."""
    code = re.sub(r'//.*', '', verilog)
    code = re.sub(r'/\*[\s\S]*?\*/', '', code)

    # Count operators in meaningful contexts
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


# ========================== QUBO ==========================

DECISION_LABELS = [
    "apply_cse",
    "apply_copy_propagation",
    "apply_boolean_simplify",
    "apply_expr_equivalence",
    "apply_dead_code_elim",
    "apply_constant_fold",
    "apply_redundant_assign",
]

NUM_QUBITS = len(DECISION_LABELS)


def _analyze_relevance(verilog):
    """Analyze verilog to determine relevance scores for each optimization."""
    relevance = [0.0] * NUM_QUBITS

    assigns = re.findall(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', verilog)
    exprs = [expr.strip() for _, expr in assigns]

    # CSE: duplicate expressions
    if len(exprs) != len(set(exprs)):
        relevance[0] = 1.0
    elif len(exprs) > 2:
        relevance[0] = 0.4

    # Copy propagation: assign x = y
    for _, expr in assigns:
        if re.match(r'^\w+$', expr.strip()):
            relevance[1] = 1.0
            break
    if relevance[1] == 0 and len(assigns) > 1:
        relevance[1] = 0.3

    # Boolean simplify: x & x, x ^ x, x | x
    for expr in exprs:
        if re.search(r'(\w+)\s*[&|^]\s*\1', expr):
            relevance[2] = 1.0
            break
    if relevance[2] == 0:
        relevance[2] = 0.5

    # Expression equivalence
    var_to_expr = {var: expr.strip() for var, expr in assigns}
    for expr in exprs:
        m = re.match(r'(\w+)\s*\^\s*(\w+)', expr)
        if m:
            a, b = m.group(1), m.group(2)
            if a in var_to_expr and b in var_to_expr:
                if var_to_expr[a] == var_to_expr[b]:
                    relevance[3] = 1.0
                    break
    if relevance[3] == 0:
        relevance[3] = 0.3

    # Dead code elimination
    relevance[4] = 0.6 if len(assigns) > 3 else 0.2

    # Constant folding
    if re.search(r"1'b[01]", verilog):
        relevance[5] = 0.8
    else:
        relevance[5] = 0.3

    # Redundant assign removal
    relevance[6] = 0.5

    return relevance


def _build_qubo_matrix(relevance):
    n = NUM_QUBITS
    Q = np.zeros((n, n))
    for i in range(n):
        Q[i][i] = -relevance[i] if relevance[i] > 0 else 0.5
    for i in range(n - 1):
        Q[i][i+1] = 0.1 * min(relevance[i], relevance[i+1])
    return Q


# ========================== QAOA ==========================

def _qubo_to_ising(Q):
    n = Q.shape[0]
    pauli_list = []
    for i in range(n):
        label = ['I'] * n
        label[n - 1 - i] = 'Z'
        pauli_list.append((''.join(label), -Q[i][i]))
    for i in range(n):
        for j in range(i+1, n):
            if abs(Q[i][j]) > 1e-10:
                label = ['I'] * n
                label[n - 1 - i] = 'Z'
                label[n - 1 - j] = 'Z'
                pauli_list.append((''.join(label), Q[i][j]))
    return SparsePauliOp.from_list(pauli_list), 0


def _solve_qaoa(Q):
    if not QISKIT_AVAILABLE:
        raise RuntimeError("Qiskit not installed")

    hamiltonian, _ = _qubo_to_ising(Q)
    circuit = QAOAAnsatz(cost_operator=hamiltonian, reps=1)

    num_params = circuit.num_parameters
    param_values = np.random.uniform(0, 2 * np.pi, num_params)
    bound_circuit = circuit.assign_parameters(dict(zip(circuit.parameters, param_values)))
    bound_circuit.measure_all()

    sim = AerSimulator()
    pm = generate_preset_pass_manager(1, sim)
    transpiled = pm.run(bound_circuit)
    result = sim.run(transpiled, shots=512).result()
    counts = result.get_counts()

    best = max(counts, key=counts.get)[::-1]

    circuit_info = {
        "num_qubits": circuit.num_qubits,
        "depth": transpiled.depth(),
        "gate_count": transpiled.size(),
        "shots": 512,
        "top_bitstrings": sorted(counts.items(), key=lambda x: -x[1])[:5]
    }

    return best, circuit_info


def _solve_classical_fallback(relevance):
    """Classical fallback when Qiskit is unavailable."""
    bitstring = ''.join(['1' if r >= 0.5 else '0' for r in relevance])
    circuit_info = {
        "num_qubits": NUM_QUBITS,
        "depth": 0,
        "gate_count": 0,
        "shots": 0,
        "top_bitstrings": [(bitstring, 1)],
        "note": "Classical fallback — Qiskit not available"
    }
    return bitstring, circuit_info


# ========================== OPTIMIZATION PASSES ==========================

def _parse_assigns(verilog):
    return re.findall(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', verilog)


def _apply_cse(verilog):
    """Common Subexpression Elimination."""
    assigns = _parse_assigns(verilog)
    if len(assigns) < 2:
        return verilog, False

    # Protect output ports from removal
    outputs = set(re.findall(r'output\s+(?:wire\s+)?(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', verilog))

    expr_to_first_var = {}
    replacements = {}
    changed = False

    for var, expr in assigns:
        expr_clean = expr.strip()
        if expr_clean in expr_to_first_var:
            first_var = expr_to_first_var[expr_clean]
            if first_var != var and var not in outputs:
                replacements[var] = first_var
                changed = True
        else:
            expr_to_first_var[expr_clean] = var

    if not changed:
        return verilog, False

    for dup_var, orig_var in replacements.items():
        verilog = re.sub(
            r'assign\s+' + re.escape(dup_var) + r'\s*=\s*.+?;\s*\n?',
            '', verilog
        )
        _dv = dup_var
        _ov = orig_var
        def _replace_in_assigns(m, dv=_dv, ov=_ov):
            lhs = m.group(1)
            rhs = m.group(2)
            rhs = re.sub(r'\b' + re.escape(dv) + r'\b', ov, rhs)
            return 'assign ' + lhs + ' = ' + rhs + ';'
        verilog = re.sub(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', _replace_in_assigns, verilog)

    return verilog, True


def _apply_copy_propagation(verilog):
    """Remove alias assignments like assign t2 = t1 (never removes output ports)."""
    assigns = _parse_assigns(verilog)
    outputs = set(re.findall(r'output\s+(?:wire\s+)?(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', verilog))
    changed = False

    for var, expr in assigns:
        expr_clean = expr.strip()
        # Only propagate non-output aliases
        if re.match(r'^[a-zA-Z_]\w*$', expr_clean) and expr_clean != var and var not in outputs:
            verilog = re.sub(
                r'assign\s+' + re.escape(var) + r'\s*=\s*' + re.escape(expr_clean) + r'\s*;\s*\n?',
                '', verilog
            )
            _var = var
            _expr = expr_clean
            def _replace_copy(m, v=_var, e=_expr):
                lhs = m.group(1)
                rhs = m.group(2)
                rhs = re.sub(r'\b' + re.escape(v) + r'\b', e, rhs)
                return 'assign ' + lhs + ' = ' + rhs + ';'
            verilog = re.sub(r'assign\s+(\w+)\s*=\s*(.+?)\s*;', _replace_copy, verilog)
            changed = True

    return verilog, changed


def _apply_boolean_simplify(verilog):
    """Apply boolean simplification rules."""
    original = verilog
    verilog = re.sub(r'(\w+)\s*\^\s*\1\b', "1'b0", verilog)
    verilog = re.sub(r'(\w+)\s*&\s*\1\b', r'\1', verilog)
    verilog = re.sub(r'(\w+)\s*\|\s*\1\b', r'\1', verilog)
    verilog = re.sub(r"(\w+)\s*&\s*1'b1", r'\1', verilog)
    verilog = re.sub(r"(\w+)\s*\|\s*1'b0", r'\1', verilog)
    verilog = re.sub(r"(\w+)\s*&\s*1'b0", "1'b0", verilog)
    verilog = re.sub(r"(\w+)\s*\|\s*1'b1", "1'b1", verilog)
    verilog = re.sub(r"(\w+)\s*\^\s*1'b0", r'\1', verilog)
    verilog = re.sub(
        r'\((\w+)\s*&\s*(\w+)\)\s*\|\s*\(\1\s*\^\s*\2\)',
        r'\1 | \2', verilog
    )
    verilog = re.sub(
        r'\((\w+)\s*\|\s*(\w+)\)\s*&\s*\(\1\s*\|\s*\2\)',
        r'\1 | \2', verilog
    )
    return verilog, verilog != original


def _apply_expr_equivalence(verilog):
    """Detect vars with identical expressions and simplify XOR to 0."""
    assigns = _parse_assigns(verilog)
    var_to_expr = {var: expr.strip() for var, expr in assigns}
    changed = False

    for var, expr in assigns:
        expr_clean = expr.strip()
        m = re.match(r'^(\w+)\s*\^\s*(\w+)$', expr_clean)
        if m:
            a, b = m.group(1), m.group(2)
            expr_a = var_to_expr.get(a, a)
            expr_b = var_to_expr.get(b, b)
            if expr_a == expr_b:
                verilog = re.sub(
                    r'assign\s+' + re.escape(var) + r'\s*=\s*' + re.escape(a) + r'\s*\^\s*' + re.escape(b) + r'\s*;',
                    "assign " + var + " = 1'b0;",
                    verilog
                )
                changed = True
        m2 = re.match(r'^(\w+)\s*&\s*(\w+)$', expr_clean)
        if m2:
            a, b = m2.group(1), m2.group(2)
            expr_a = var_to_expr.get(a, a)
            expr_b = var_to_expr.get(b, b)
            if expr_a == expr_b and a != b:
                verilog = re.sub(
                    r'assign\s+' + re.escape(var) + r'\s*=\s*' + re.escape(a) + r'\s*&\s*' + re.escape(b) + r'\s*;',
                    "assign " + var + " = " + a + ";",
                    verilog
                )
                changed = True

    return verilog, changed


def _apply_dead_code_elim(verilog):
    """Remove assignments to variables never used elsewhere."""
    assigns = _parse_assigns(verilog)
    if len(assigns) < 2:
        return verilog, False

    changed = False
    outputs = set(re.findall(r'output\s+(?:wire\s+)?(?:reg\s+)?(?:\[\d+:\d+\]\s+)?(\w+)', verilog))

    for var, expr in assigns:
        if var in outputs:
            continue
        other_code = re.sub(r'assign\s+' + re.escape(var) + r'\s*=\s*.+?;', '', verilog)
        uses = re.findall(r'\b' + re.escape(var) + r'\b', other_code)
        if len(uses) == 0:
            verilog = re.sub(
                r'assign\s+' + re.escape(var) + r'\s*=\s*.+?;\s*\n?',
                '', verilog
            )
            verilog = re.sub(r'wire\s+' + re.escape(var) + r'\s*;\s*\n?', '', verilog)
            changed = True

    return verilog, changed


def _apply_constant_fold(verilog):
    """Propagate constant assignments."""
    changed = False
    assigns = _parse_assigns(verilog)

    for var, expr in assigns:
        expr_clean = expr.strip()
        if re.match(r"^\d+'[bhd]?[0-9a-fA-F]+$", expr_clean):
            other_assigns = [(v, e) for v, e in _parse_assigns(verilog) if v != var]
            for ov, oe in other_assigns:
                if re.search(r'\b' + re.escape(var) + r'\b', oe):
                    new_oe = re.sub(r'\b' + re.escape(var) + r'\b', expr_clean, oe)
                    verilog = verilog.replace(
                        'assign ' + ov + ' = ' + oe + ';',
                        'assign ' + ov + ' = ' + new_oe + ';'
                    )
                    changed = True

    return verilog, changed


# ========================== CLEANUP ==========================

def _cleanup(verilog):
    lines = verilog.split("\n")
    cleaned = []
    prev_blank = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if not prev_blank:
                cleaned.append("")
                prev_blank = True
            continue
        prev_blank = False
        cleaned.append(line.rstrip())
    # Remove leading/trailing blank lines
    while cleaned and cleaned[0] == "":
        cleaned.pop(0)
    while cleaned and cleaned[-1] == "":
        cleaned.pop()
    return "\n".join(cleaned)


# ========================== MAIN ==========================

def quantum_optimize(verilog):
    """Main entry point: runs QAOA then applies selected optimizations."""

    original = verilog

    # Step 1: Analyze relevance for QUBO
    relevance = _analyze_relevance(verilog)
    Q = _build_qubo_matrix(relevance)

    # Step 2: Run QAOA or classical fallback
    try:
        bitstring, circuit_info = _solve_qaoa(Q)
    except Exception as e:
        print(f"[Quantum] QAOA failed ({e}), using classical fallback")
        bitstring, circuit_info = _solve_classical_fallback(relevance)

    # Step 3: Map bitstring to decisions
    decisions = {}
    for i in range(NUM_QUBITS):
        decisions[DECISION_LABELS[i]] = (bitstring[i] == '1') if i < len(bitstring) else False

    # Step 4: Force-enable optimizations with high relevance (>= 0.8)
    for i, label in enumerate(DECISION_LABELS):
        if relevance[i] >= 0.8:
            decisions[label] = True

    # Step 5: Apply selected optimizations
    applied = []
    optimized = verilog

    if decisions.get("apply_cse"):
        optimized, did = _apply_cse(optimized)
        if did:
            applied.append("Common Subexpression Elimination (CSE)")

    if decisions.get("apply_copy_propagation"):
        optimized, did = _apply_copy_propagation(optimized)
        if did:
            applied.append("Copy Propagation")

    if decisions.get("apply_boolean_simplify"):
        optimized, did = _apply_boolean_simplify(optimized)
        if did:
            applied.append("Boolean Simplification")

    if decisions.get("apply_expr_equivalence"):
        optimized, did = _apply_expr_equivalence(optimized)
        if did:
            applied.append("Expression Equivalence Simplification")

    if decisions.get("apply_dead_code_elim"):
        optimized, did = _apply_dead_code_elim(optimized)
        if did:
            applied.append("Dead Code Elimination")

    if decisions.get("apply_constant_fold"):
        optimized, did = _apply_constant_fold(optimized)
        if did:
            applied.append("Constant Folding")

    # Always run boolean simplify as a final pass
    optimized, did = _apply_boolean_simplify(optimized)
    if did and "Boolean Simplification" not in applied:
        applied.append("Boolean Simplification (final pass)")

    # Cleanup
    optimized = _cleanup(optimized)

    print("[Quantum] Bitstring:", bitstring)
    print("[Quantum] Decisions:", decisions)
    print("[Quantum] Applied:", applied)

    return {
        "optimized": optimized,
        "quantum_info": {
            "bitstring": bitstring,
            "decisions": decisions,
            "applied_optimizations": applied,
            "circuit_info": circuit_info,
            "relevance_scores": {DECISION_LABELS[i]: round(relevance[i], 2) for i in range(NUM_QUBITS)},
        }
    }