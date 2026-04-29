"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface Metrics {
    gate_count: number;
    estimated_area: number;
    estimated_delay: number;
    line_count: number;
}

interface Improvement {
    gate_reduction: number;
    area_reduction: number;
    delay_reduction: number;
}

interface CircuitInfo {
    num_qubits: number;
    depth: number;
    gate_count: number;
    shots: number;
    top_bitstrings: [string, number][];
    note?: string;
}

interface QuantumInfo {
    bitstring: string;
    decisions: Record<string, boolean>;
    applied_optimizations: string[];
    circuit_info: CircuitInfo;
    relevance_scores: Record<string, number>;
}

export default function OptimizationPage() {

    const [verilog, setVerilog] = useState("")
    const [originalCode, setOriginalCode] = useState("")
    const [optimized, setOptimized] = useState("")
    const [loading, setLoading] = useState(false)
    const [before, setBefore] = useState<Metrics | null>(null)
    const [after, setAfter] = useState<Metrics | null>(null)
    const [improvement, setImprovement] = useState<Improvement | null>(null)
    const [quantumInfo, setQuantumInfo] = useState<QuantumInfo | null>(null)
    const [method, setMethod] = useState<string>("")


    useEffect(() => {

        const code = localStorage.getItem("verilog_code")

        if (code) {
            setVerilog(code)
            setOriginalCode(code)
        }

    }, [])



    const optimize = async () => {

        setLoading(true)
        setBefore(null)
        setAfter(null)
        setImprovement(null)
        setQuantumInfo(null)
        setMethod("")
        setOptimized("")

        try {

            const response = await fetch(
                "http://localhost:8001/optimize/",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        verilog: verilog
                    })
                }
            )

            const data = await response.json()

            setOptimized(data.optimized || "")

            // Store optimized code for simulation
            if (data.optimized) {
                localStorage.setItem("verilog_code", data.optimized)
            }

            // Set metrics if available
            if (data.before) setBefore(data.before)
            if (data.after) setAfter(data.after)
            if (data.improvement) setImprovement(data.improvement)
            if (data.quantum_info) setQuantumInfo(data.quantum_info)
            if (data.method) setMethod(data.method)

        } catch (error) {

            console.error("Optimize Error:", error)

        } finally {
            setLoading(false)
        }

    }



    const sendToSimulation = () => {

        const codeToSend = optimized || verilog
        if (!codeToSend) {
            alert("No code available")
            return
        }

        localStorage.setItem("verilog_code", codeToSend)

        window.location.href = "/dashboard/simulation"

    }

    const overallScore = improvement
        ? Math.round(((improvement.gate_reduction || 0) + (improvement.area_reduction || 0) + (improvement.delay_reduction || 0)) / 3)
        : 0;


    return (

        <div className="p-10">

            <h1 className="text-3xl mb-5 font-bold text-white tracking-tight">
                Optimization Page
            </h1>


            <div className="grid grid-cols-2 gap-5">


                <div>

                    <h2 className="mb-2 text-slate-300 font-medium">
                        Original Code
                    </h2>

                    <textarea
                        className="w-full h-96 bg-black text-green-400 p-4 rounded-lg font-mono text-sm border border-slate-800"
                        value={verilog}
                        onChange={(e) => setVerilog(e.target.value)}
                    />

                </div>


                <div>

                    <h2 className="mb-2 text-slate-300 font-medium">
                        Optimized Code
                    </h2>

                    <textarea
                        className="w-full h-96 bg-black text-cyan-400 p-4 rounded-lg font-mono text-sm border border-slate-800"
                        value={optimized}
                        readOnly
                    />

                </div>


            </div>


            <div className="mt-5 flex gap-3">

                <Button
                    onClick={optimize}
                    disabled={loading || !verilog}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                    {loading ? "⏳ Optimizing..." : "⚡ Optimize"}
                </Button>

                <Button
                    onClick={sendToSimulation}
                    className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white"
                >
                    Send To Simulation
                </Button>

                <Button
                    variant="destructive"
                    onClick={() => {
                        setVerilog("")
                        setOriginalCode("")
                        setOptimized("")
                        setBefore(null)
                        setAfter(null)
                        setImprovement(null)
                        setQuantumInfo(null)
                        setMethod("")
                        localStorage.removeItem("verilog_code")
                    }}
                >
                    Clear
                </Button>

                {method && (
                    <span className="self-center ml-3 text-xs uppercase tracking-wider px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {method} optimizer
                    </span>
                )}

            </div>


            {/* ================================================================ */}
            {/* METRICS COMPARISON SECTION                                       */}
            {/* ================================================================ */}
            {before && after && improvement && (

                <div className="mt-8 space-y-6">

                    {/* Improvement Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">

                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5 text-center">
                            <p className="text-sm text-emerald-400/70 uppercase tracking-wider mb-1">
                                Gate Reduction
                            </p>
                            <p className="text-3xl font-bold text-emerald-400">
                                {improvement.gate_reduction > 0 ? `${improvement.gate_reduction}%` : "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-5 text-center">
                            <p className="text-sm text-blue-400/70 uppercase tracking-wider mb-1">
                                Area Reduction
                            </p>
                            <p className="text-3xl font-bold text-blue-400">
                                {improvement.area_reduction > 0 ? `${improvement.area_reduction}%` : "—"}
                            </p>
                        </div>

                        <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-5 text-center">
                            <p className="text-sm text-purple-400/70 uppercase tracking-wider mb-1">
                                Delay Reduction
                            </p>
                            <p className="text-3xl font-bold text-purple-400">
                                {improvement.delay_reduction > 0 ? `${improvement.delay_reduction}%` : "—"}
                            </p>
                        </div>

                    </div>

                    {/* Overall Optimization Score */}
                    {overallScore > 0 && (
                        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5 text-center">
                            <p className="text-sm text-amber-400/70 uppercase tracking-wider mb-1">
                                Overall Optimization Score
                            </p>
                            <p className="text-4xl font-bold text-amber-400">
                                {overallScore}%
                            </p>
                            <div className="mt-3 w-full bg-amber-950/40 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-700"
                                    style={{ width: `${Math.min(overallScore, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}


                    {/* Metrics Comparison Table */}
                    <div className="rounded-xl border border-white/10 overflow-hidden">

                        <div className="bg-white/5 px-5 py-3 border-b border-white/10">
                            <h3 className="text-lg font-semibold">
                                Optimization Metrics
                            </h3>
                        </div>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-white/60">
                                    <th className="px-5 py-3">Metric</th>
                                    <th className="px-5 py-3 text-right">Before</th>
                                    <th className="px-5 py-3 text-right">After</th>
                                    <th className="px-5 py-3 text-right">Change</th>
                                </tr>
                            </thead>
                            <tbody>

                                <MetricRow
                                    label="Gate Count"
                                    before={before.gate_count}
                                    after={after.gate_count}
                                    unit=""
                                />
                                <MetricRow
                                    label="Estimated Area"
                                    before={before.estimated_area}
                                    after={after.estimated_area}
                                    unit=" µm²"
                                />
                                <MetricRow
                                    label="Estimated Delay"
                                    before={before.estimated_delay}
                                    after={after.estimated_delay}
                                    unit=" ns"
                                />
                                <MetricRow
                                    label="Line Count"
                                    before={before.line_count}
                                    after={after.line_count}
                                    unit=""
                                />

                            </tbody>
                        </table>

                    </div>

                </div>

            )}


            {/* ================================================================ */}
            {/* QUANTUM OPTIMIZATION INSIGHTS                                    */}
            {/* ================================================================ */}
            {quantumInfo && (

                <div className="mt-8 space-y-6">

                    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-950/30 to-indigo-950/30 overflow-hidden">

                        <div className="bg-violet-500/10 px-5 py-3 border-b border-violet-500/20 flex items-center gap-2">
                            <span className="text-lg">⚛️</span>
                            <h3 className="text-lg font-semibold text-violet-200">
                                Quantum Optimization Insights
                            </h3>
                            {overallScore > 0 && (
                                <span className="ml-auto text-sm font-bold text-emerald-400 bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
                                    {overallScore}% improvement
                                </span>
                            )}
                        </div>

                        <div className="p-5 space-y-5">

                            {/* Before vs After Summary */}
                            {before && after && (
                                <div>
                                    <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-2">
                                        Before vs After Summary
                                    </p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                            <p className="text-[10px] text-white/40 uppercase">Gates</p>
                                            <p className="text-sm font-mono">
                                                <span className="text-red-400/70">{before.gate_count}</span>
                                                <span className="text-white/30 mx-1">→</span>
                                                <span className="text-emerald-400">{after.gate_count}</span>
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                            <p className="text-[10px] text-white/40 uppercase">Area</p>
                                            <p className="text-sm font-mono">
                                                <span className="text-red-400/70">{before.estimated_area}</span>
                                                <span className="text-white/30 mx-1">→</span>
                                                <span className="text-emerald-400">{after.estimated_area}</span>
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                                            <p className="text-[10px] text-white/40 uppercase">Delay</p>
                                            <p className="text-sm font-mono">
                                                <span className="text-red-400/70">{before.estimated_delay}</span>
                                                <span className="text-white/30 mx-1">→</span>
                                                <span className="text-emerald-400">{after.estimated_delay}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* QAOA Bitstring */}
                            <div>
                                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-2">
                                    QAOA Bitstring Result
                                </p>
                                <div className="flex gap-1 flex-wrap">
                                    {quantumInfo.bitstring.split("").map((bit, i) => (
                                        <span
                                            key={i}
                                            className={`inline-flex items-center justify-center w-8 h-8 rounded font-mono text-sm font-bold transition-all ${
                                                bit === "1"
                                                    ? "bg-violet-500/30 text-violet-200 border border-violet-400/40"
                                                    : "bg-white/5 text-white/30 border border-white/10"
                                            }`}
                                        >
                                            {bit}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex gap-1 flex-wrap mt-1">
                                    {Object.keys(quantumInfo.decisions).map((key, i) => (
                                        <span key={i} className="text-[10px] text-white/30 w-8 text-center truncate" title={key}>
                                            {key.replace("apply_", "").slice(0, 4)}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Applied Optimizations */}
                            <div>
                                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-2">
                                    Optimizations Applied ({quantumInfo.applied_optimizations.length})
                                </p>
                                {quantumInfo.applied_optimizations.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {quantumInfo.applied_optimizations.map((opt, i) => (
                                            <span
                                                key={i}
                                                className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                            >
                                                ✓ {opt}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-white/40">No transformations were needed — code is already optimal.</p>
                                )}
                            </div>

                            {/* Quantum Decision Map */}
                            <div>
                                <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-2">
                                    Quantum Decision Map
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(quantumInfo.decisions).map(([key, enabled]) => {
                                        const relevance = quantumInfo.relevance_scores?.[key] ?? 0;
                                        return (
                                            <div
                                                key={key}
                                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                                                    enabled
                                                        ? "bg-violet-500/15 border border-violet-500/30 text-violet-200"
                                                        : "bg-white/5 border border-white/10 text-white/30"
                                                }`}
                                            >
                                                <span className="font-medium">
                                                    {enabled ? "●" : "○"}{" "}
                                                    {key.replace("apply_", "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                                                </span>
                                                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                                                    relevance >= 0.8 ? "bg-emerald-500/20 text-emerald-300" :
                                                    relevance >= 0.5 ? "bg-amber-500/20 text-amber-300" :
                                                    "bg-white/10 text-white/40"
                                                }`}>
                                                    {(relevance * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quantum Circuit Info */}
                            {quantumInfo.circuit_info && (
                                <div>
                                    <p className="text-xs text-violet-400/60 uppercase tracking-wider mb-2">
                                        Quantum Circuit Info
                                    </p>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                                            <p className="text-2xl font-bold text-indigo-300">{quantumInfo.circuit_info.num_qubits}</p>
                                            <p className="text-[10px] text-indigo-400/60 uppercase mt-1">Qubits</p>
                                        </div>
                                        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                                            <p className="text-2xl font-bold text-indigo-300">{quantumInfo.circuit_info.depth}</p>
                                            <p className="text-[10px] text-indigo-400/60 uppercase mt-1">Depth</p>
                                        </div>
                                        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                                            <p className="text-2xl font-bold text-indigo-300">{quantumInfo.circuit_info.gate_count}</p>
                                            <p className="text-[10px] text-indigo-400/60 uppercase mt-1">Gates</p>
                                        </div>
                                        <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 text-center">
                                            <p className="text-2xl font-bold text-indigo-300">{quantumInfo.circuit_info.shots}</p>
                                            <p className="text-[10px] text-indigo-400/60 uppercase mt-1">Shots</p>
                                        </div>
                                    </div>

                                    {/* Top Measurement Results */}
                                    {quantumInfo.circuit_info.top_bitstrings && quantumInfo.circuit_info.top_bitstrings.length > 0 && (
                                        <div className="mt-3">
                                            <p className="text-[10px] text-violet-400/50 uppercase tracking-wider mb-1">Top Measurement Results</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {quantumInfo.circuit_info.top_bitstrings.map(([bs, count], i) => (
                                                    <span
                                                        key={i}
                                                        className={`font-mono text-xs px-2 py-1 rounded border ${
                                                            i === 0
                                                                ? "bg-violet-500/20 border-violet-400/30 text-violet-200"
                                                                : "bg-white/5 border-white/10 text-white/40"
                                                        }`}
                                                    >
                                                        {bs} <span className="text-[10px] opacity-60">×{count}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Classical fallback note */}
                                    {quantumInfo.circuit_info.note && (
                                        <p className="mt-2 text-xs text-amber-400/60 italic">
                                            ⚠ {quantumInfo.circuit_info.note}
                                        </p>
                                    )}
                                </div>
                            )}

                        </div>

                    </div>

                </div>

            )}

        </div>

    )

}


function MetricRow({ label, before, after, unit }: {
    label: string;
    before: number;
    after: number;
    unit: string;
}) {

    const diff = before - after
    const pct = before > 0 ? ((diff / before) * 100).toFixed(1) : "0.0"
    const improved = diff > 0
    const same = diff === 0

    return (
        <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td className="px-5 py-3 font-medium">{label}</td>
            <td className="px-5 py-3 text-right text-white/70">
                {before}{unit}
            </td>
            <td className="px-5 py-3 text-right text-white/70">
                {after}{unit}
            </td>
            <td className={`px-5 py-3 text-right font-semibold ${
                same ? "text-white/40" :
                improved ? "text-emerald-400" : "text-red-400"
            }`}>
                {same ? "—" :
                 improved ? `↓ ${pct}%` : `↑ ${Math.abs(parseFloat(pct))}%`}
            </td>
        </tr>
    )

}