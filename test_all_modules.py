"""
Comprehensive module-by-module test for the QANTYX platform.
Tests: Health checks, AI Design Generation, Optimization (Quantum), Simulation
"""
import httpx
import json
import sys
import time

BACKEND = "http://127.0.0.1:8001"
AI_ENGINE = "http://127.0.0.1:8000"
VLSI_TOOLS = "http://127.0.0.1:8003"

passed = 0
failed = 0

def test(name, func):
    global passed, failed
    try:
        func()
        print(f"  PASS: {name}")
        passed += 1
    except Exception as e:
        print(f"  FAIL: {name} -> {e}")
        failed += 1

# ============================================================
print("\n" + "="*60)
print("MODULE 1: HEALTH CHECKS")
print("="*60)

def test_ai_health():
    r = httpx.get(f"{AI_ENGINE}/health", timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

def test_backend_health():
    r = httpx.get(f"{BACKEND}/health", timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "running"

def test_vlsi_health():
    r = httpx.get(f"{VLSI_TOOLS}/health", timeout=10)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

test("AI Engine health (:8000)", test_ai_health)
test("Backend health (:8001)", test_backend_health)
test("VLSI Tools health (:8003)", test_vlsi_health)

# ============================================================
print("\n" + "="*60)
print("MODULE 2: AI DESIGN GENERATION")
print("="*60)

generated_verilog = None

def test_ai_generate():
    global generated_verilog
    r = httpx.post(f"{AI_ENGINE}/generate",
                   json={"prompt": "4-bit counter with clock and reset"},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "verilog" in data
    assert len(data["verilog"]) > 10
    generated_verilog = data["verilog"]
    print(f"    Generated {len(generated_verilog)} chars of Verilog")

def test_backend_design():
    r = httpx.post(f"{BACKEND}/design/generate",
                   json={"prompt": "simple AND gate"},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "verilog" in data
    print(f"    Got design via backend: {len(data['verilog'])} chars")

test("AI Engine /generate", test_ai_generate)
test("Backend /design/ proxy", test_backend_design)

# ============================================================
print("\n" + "="*60)
print("MODULE 3: OPTIMIZATION (QUANTUM)")
print("="*60)

# Use a known test input for consistent results
test_verilog = """module counter(
    output reg count
);
    reg [7:0] count_reg;
    rule increment;
        count_reg = count_reg + 1;
    endrule
endmodule"""

optimized_verilog = None

def test_vlsi_optimize_direct():
    global optimized_verilog
    r = httpx.post(f"{VLSI_TOOLS}/optimize",
                   json={"verilog": test_verilog},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "optimized" in data, f"Missing 'optimized' key. Got: {list(data.keys())}"
    optimized_verilog = data["optimized"]
    assert "always @(posedge clk" in optimized_verilog, "Quantum optimization did not apply rule->always"
    assert "endrule" not in optimized_verilog, "endrule was not converted"
    print(f"    Quantum optimizer produced {len(optimized_verilog)} chars")

def test_backend_optimize():
    r = httpx.post(f"{BACKEND}/optimize/",
                   json={"verilog": test_verilog},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "optimized" in data, f"Missing 'optimized' key. Got: {list(data.keys())}"
    assert "always @(posedge clk" in data["optimized"]
    print(f"    End-to-end optimization OK: {len(data['optimized'])} chars")

def test_optimize_clean_passthrough():
    clean = "module test(input clk, input reset, output b); assign b = 1; endmodule"
    r = httpx.post(f"{VLSI_TOOLS}/optimize",
                   json={"verilog": clean},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "optimized" in data
    # Clean code should pass through mostly unchanged
    assert "module test" in data["optimized"]
    print(f"    Clean Verilog passthrough OK")

def test_optimize_response_format():
    r = httpx.post(f"{BACKEND}/optimize/",
                   json={"verilog": test_verilog},
                   timeout=30)
    data = r.json()
    keys = set(data.keys())
    assert keys == {"optimized"}, f"Response format changed! Keys: {keys}"
    assert isinstance(data["optimized"], str)
    print(f"    Response format: {{'optimized': '<string>'}} - correct")

test("VLSI Tools /optimize (quantum, direct)", test_vlsi_optimize_direct)
test("Backend /optimize/ (end-to-end)", test_backend_optimize)
test("Clean Verilog passthrough", test_optimize_clean_passthrough)
test("Response format validation", test_optimize_response_format)

# ============================================================
print("\n" + "="*60)
print("MODULE 4: SIMULATION")
print("="*60)

sim_verilog = optimized_verilog or test_verilog

def test_vlsi_simulate():
    r = httpx.post(f"{VLSI_TOOLS}/simulate",
                   json={"verilog": sim_verilog},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "result" in data
    assert "waveform" in data
    assert "analysis" in data
    assert len(data["waveform"]) > 0
    print(f"    Simulation status: {data['result']}")
    print(f"    Signals found: {data.get('signals_found', '?')}")
    print(f"    Waveform entries: {len(data['waveform'])}")

def test_simulate_analysis():
    r = httpx.post(f"{VLSI_TOOLS}/simulate",
                   json={"verilog": sim_verilog},
                   timeout=30)
    data = r.json()
    analysis = data["analysis"]
    assert "timing" in analysis
    assert "power" in analysis
    assert "area" in analysis
    assert "drc" in analysis
    print(f"    Timing: {analysis['timing']['critical_path_ns']}ns critical path")
    print(f"    Power: {analysis['power']['total_power_uw']}uW total")
    print(f"    Area: {analysis['area']['total_gate_equivalents']} gate equiv")
    print(f"    DRC: {analysis['drc']['overall_status']}")

def test_backend_simulate():
    r = httpx.post(f"{BACKEND}/simulate",
                   json={"verilog": sim_verilog},
                   timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "waveform" in data
    print(f"    Backend simulation proxy OK")

test("VLSI Tools /simulate (direct)", test_vlsi_simulate)
test("Simulation analysis (timing/power/area/DRC)", test_simulate_analysis)
test("Backend /simulate/ (end-to-end)", test_backend_simulate)

# ============================================================
print("\n" + "="*60)
print("MODULE 5: STATS & ANALYTICS")
print("="*60)

def test_stats():
    r = httpx.get(f"{BACKEND}/api/stats", timeout=10)
    assert r.status_code == 200
    data = r.json()
    print(f"    Stats response: {json.dumps(data, indent=2)[:200]}")

test("Backend /api/stats", test_stats)

# ============================================================
print("\n" + "="*60)
print("MODULE 6: QUANTUM ENGINE VERIFICATION")
print("="*60)

def test_quantum_decisions():
    """Verify quantum optimizer makes intelligent decisions"""
    # Test with code needing many transformations
    r = httpx.post(f"{VLSI_TOOLS}/optimize",
                   json={"verilog": test_verilog},
                   timeout=30)
    data = r.json()
    v = data["optimized"]
    assert "always @(posedge clk" in v, "Missing always block conversion"
    assert "endrule" not in v, "endrule not converted"
    print(f"    Quantum decisions verified on complex input")

def test_quantum_minimal_changes():
    """Verify quantum optimizer doesn't over-optimize clean code"""
    clean = "module good(input clk, input reset, output reg [3:0] count);\nalways @(posedge clk or posedge reset) begin\nif (reset) count <= 0;\nelse count <= count + 1;\nend\nendmodule"
    r = httpx.post(f"{VLSI_TOOLS}/optimize",
                   json={"verilog": clean},
                   timeout=30)
    data = r.json()
    assert "optimized" in data
    # Well-formed code should not be mangled
    assert "module good" in data["optimized"]
    assert "endmodule" in data["optimized"]
    print(f"    Quantum optimizer preserves well-formed code")

test("Quantum decision-making (complex input)", test_quantum_decisions)
test("Quantum minimal changes (clean input)", test_quantum_minimal_changes)

# ============================================================
print("\n" + "="*60)
print(f"RESULTS: {passed} passed, {failed} failed out of {passed + failed} tests")
print("="*60)

if failed > 0:
    sys.exit(1)
else:
    print("ALL TESTS PASSED!")
