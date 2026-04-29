import httpx

VLSI_SERVICE_URL = "http://localhost:8003"


async def run_simulation(verilog_code):
    """Send Verilog directly to VLSI tools for simulation (no re-optimization)."""

    async with httpx.AsyncClient(timeout=60.0) as client:

        response = await client.post(
            f"{VLSI_SERVICE_URL}/simulate",
            json={
                "verilog": verilog_code
            }
        )

    return response.json()


async def optimize_design(verilog):
    """Call VLSI tools /optimize endpoint (quantum → logic → classical fallback)."""

    print("Calling VLSI tools optimizer")

    async with httpx.AsyncClient(timeout=120.0) as client:

        response = await client.post(
            f"{VLSI_SERVICE_URL}/optimize",
            json={
                "verilog": verilog
            }
        )

    result = response.json()

    # result contains: optimized, before, after, improvement, quantum_info, method
    return result