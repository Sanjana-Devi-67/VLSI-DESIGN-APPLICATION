"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlayCircle, Clock, CheckCircle2, AlertCircle,
  AlertTriangle, Trash2, Eye, XCircle,
  Cpu, Zap, Square, Shield
} from "lucide-react";

const BACKEND_URL = "http://127.0.0.1:8001";
const VLSI_URL = "http://127.0.0.1:8003";

// ─── SVG Waveform Component ────────────────────────────────────────
function WaveformSVG({ signal, index }: { signal: any; index: number }) {
  const values = signal.values.split("");
  const stepWidth = 48;
  const height = 40;
  const highY = 6;
  const lowY = height - 6;
  const totalWidth = values.length * stepWidth;

  // Build SVG path for step-function waveform
  let pathD = "";
  let currentY = values[0] === "1" ? highY : lowY;
  pathD += `M 0 ${currentY}`;

  for (let i = 0; i < values.length; i++) {
    const newY = values[i] === "1" ? highY : lowY;
    const x = i * stepWidth;
    const xEnd = (i + 1) * stepWidth;

    if (newY !== currentY) {
      // Vertical transition
      pathD += ` L ${x} ${currentY} L ${x} ${newY}`;
      currentY = newY;
    }
    // Horizontal hold
    pathD += ` L ${xEnd} ${currentY}`;
  }

  const colors = [
    { stroke: "#22d3ee", fill: "rgba(34,211,238,0.08)" },
    { stroke: "#a78bfa", fill: "rgba(167,139,250,0.08)" },
    { stroke: "#34d399", fill: "rgba(52,211,153,0.08)" },
    { stroke: "#f472b6", fill: "rgba(244,114,182,0.08)" },
    { stroke: "#fbbf24", fill: "rgba(251,191,36,0.08)" },
    { stroke: "#fb923c", fill: "rgba(251,146,60,0.08)" },
  ];

  const color = colors[index % colors.length];

  // Build fill path (area under the waveform)
  const fillD = pathD + ` L ${totalWidth} ${lowY} L 0 ${lowY} Z`;

  return (
    <div className="flex items-center gap-4">
      {/* Signal label */}
      <div className="w-28 flex-shrink-0 flex flex-col">
        <span className="font-mono text-sm" style={{ color: color.stroke }}>
          {signal.signal}
        </span>
        <span className="text-slate-500 text-[10px]">
          {signal.type || "signal"} [{signal.width || 1}]
        </span>
      </div>

      {/* SVG Waveform */}
      <div className="flex-1 overflow-x-auto">
        <svg
          width={totalWidth}
          height={height}
          viewBox={`0 0 ${totalWidth} ${height}`}
          className="block"
        >
          {/* Gridlines */}
          {values.map((_: string, i: number) => (
            <line
              key={`grid-${i}`}
              x1={i * stepWidth}
              y1={0}
              x2={i * stepWidth}
              y2={height}
              stroke="#1e293b"
              strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          ))}

          {/* High/Low reference lines */}
          <line x1={0} y1={highY} x2={totalWidth} y2={highY} stroke="#334155" strokeWidth={0.5} strokeDasharray="4,4" />
          <line x1={0} y1={lowY} x2={totalWidth} y2={lowY} stroke="#334155" strokeWidth={0.5} strokeDasharray="4,4" />

          {/* Fill area */}
          <path d={fillD} fill={color.fill} />

          {/* Waveform line */}
          <path
            d={pathD}
            fill="none"
            stroke={color.stroke}
            strokeWidth={2}
            strokeLinejoin="miter"
          />

          {/* Transition markers */}
          {values.map((val: string, i: number) => {
            if (i > 0 && val !== values[i - 1]) {
              const x = i * stepWidth;
              return (
                <circle
                  key={`dot-${i}`}
                  cx={x}
                  cy={val === "1" ? highY : lowY}
                  r={2.5}
                  fill={color.stroke}
                  opacity={0.7}
                />
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Time Axis Component ───────────────────────────────────────────
function TimeAxis({ count }: { count: number }) {
  const stepWidth = 48;
  const totalWidth = count * stepWidth;

  return (
    <div className="flex items-center gap-4 mt-1">
      <div className="w-28 flex-shrink-0" />
      <div className="flex-1 overflow-x-auto">
        <svg width={totalWidth} height={20} viewBox={`0 0 ${totalWidth} 20`}>
          {Array.from({ length: count }).map((_, i) => (
            <g key={i}>
              <line x1={i * stepWidth} y1={0} x2={i * stepWidth} y2={6} stroke="#475569" strokeWidth={1} />
              <text x={i * stepWidth + 2} y={16} fill="#64748b" fontSize="9" fontFamily="monospace">
                {i * 10}ns
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Analysis Panel Component ──────────────────────────────────────
function AnalysisPanel({ analysis }: { analysis: any }) {
  if (!analysis) return null;

  const statusColorMap: Record<string, string> = {
    "Passed": "text-green-400 bg-green-500/10 border-green-500/30",
    "Warning": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    "Failed": "text-red-400 bg-red-500/10 border-red-500/30",
  };
  const statusColor = statusColorMap[analysis.status as string] || "text-slate-400 bg-slate-500/10 border-slate-500/30";

  const statusIconMap: Record<string, typeof CheckCircle2> = {
    "Passed": CheckCircle2,
    "Warning": AlertTriangle,
    "Failed": XCircle,
  };
  const StatusIcon = statusIconMap[analysis.status as string] || AlertCircle;

  return (
    <div className="space-y-4">
      {/* Overall Status */}
      <div className={`flex items-center gap-3 p-4 rounded-lg border ${statusColor}`}>
        <StatusIcon className="w-6 h-6 flex-shrink-0" />
        <div>
          <div className="font-semibold text-lg">Simulation {analysis.status}</div>
          <div className="text-sm opacity-80">
            {analysis.syntax?.error_count || 0} error(s), {analysis.syntax?.warning_count || 0} warning(s)
          </div>
        </div>
      </div>

      {/* Syntax Issues */}
      {(analysis.syntax?.errors?.length > 0 || analysis.syntax?.warnings?.length > 0) && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              Syntax Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {analysis.syntax.errors?.map((err: string, i: number) => (
              <div key={`err-${i}`} className="flex items-center gap-2 text-red-400">
                <XCircle className="w-3 h-3 flex-shrink-0" /> {err}
              </div>
            ))}
            {analysis.syntax.warnings?.map((warn: string, i: number) => (
              <div key={`warn-${i}`} className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {warn}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Timing Analysis */}
        {analysis.timing && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Timing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Critical Path</span>
                <span className="text-white font-mono">{analysis.timing.critical_path_ns} ns</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Max Frequency</span>
                <span className="text-white font-mono">{analysis.timing.max_frequency_mhz} MHz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Slack</span>
                <span className={`font-mono ${analysis.timing.slack_met ? 'text-green-400' : 'text-red-400'}`}>
                  {analysis.timing.slack_ns} ns {analysis.timing.slack_met ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Setup Margin</span>
                <span className="text-white font-mono">{analysis.timing.setup_margin_ns} ns</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Logic Levels</span>
                <span className="text-white font-mono">{analysis.timing.logic_levels}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Power Estimation */}
        {analysis.power && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Power Estimation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Dynamic Power</span>
                <span className="text-white font-mono">{analysis.power.dynamic_power_uw} µW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Leakage Power</span>
                <span className="text-white font-mono">{analysis.power.leakage_power_uw} µW</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-slate-300 font-medium">Total Power</span>
                <span className="text-cyan-400 font-mono font-medium">{analysis.power.total_power_uw} µW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Toggle Rate</span>
                <span className="text-white font-mono">{(analysis.power.toggle_rate * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Supply Voltage</span>
                <span className="text-white font-mono">{analysis.power.voltage_v} V</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Area Estimation */}
        {analysis.area && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Square className="w-4 h-4 text-purple-400" />
                Area Estimation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Flip-Flops</span>
                <span className="text-white font-mono">{analysis.area.flip_flops}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Combo Gates</span>
                <span className="text-white font-mono">{analysis.area.combinational_gates}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-1">
                <span className="text-slate-300 font-medium">Total Gates</span>
                <span className="text-cyan-400 font-mono font-medium">{analysis.area.total_gate_equivalents}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Area</span>
                <span className="text-white font-mono">{analysis.area.estimated_area_um2} µm²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tech Node</span>
                <span className="text-white font-mono">{analysis.area.technology_node}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Design Rule Checks */}
      {analysis.drc && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Design Rule Checks (DRC)
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                analysis.drc.overall_status === 'PASS' ? 'bg-green-500/20 text-green-400' :
                analysis.drc.overall_status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {analysis.drc.passed}/{analysis.drc.total_checks} Passed
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {analysis.drc.checks?.map((check: any, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs p-2 rounded bg-slate-900/50">
                  {check.status === "PASS" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />}
                  {check.status === "WARN" && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />}
                  {check.status === "FAIL" && <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
                  <div>
                    <div className="text-slate-300 font-medium">{check.name}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{check.details}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Simulation Page ──────────────────────────────────────────
export default function SimulationPage() {

  const [verilogCode, setVerilogCode] = useState("");
  const [runs, setRuns] = useState<any[]>([]);
  const [waveform, setWaveform] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [simError, setSimError] = useState("");
  const [simulating, setSimulating] = useState(false);

  // Load runs from backend
  useEffect(() => {
    fetchRuns();

    const savedCode = localStorage.getItem("verilog_code");
    if (savedCode) {
      setVerilogCode(savedCode);
      localStorage.removeItem("verilog_code");
    }
  }, []);

  const fetchRuns = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/runs/`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data);
      }
    } catch (error) {
      console.error("Failed to fetch runs:", error);
    }
  };


  const startSimulation = async () => {
    if (!verilogCode || verilogCode.trim() === "") {
      alert("Please paste or generate Verilog code");
      return;
    }

    setSimError("");
    setSimulating(true);
    setAnalysis(null);
    setWaveform(null);

    try {
      // Create run in backend (status = Running)
      const createResponse = await fetch(`${BACKEND_URL}/api/runs/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "custom_design.v",
          type: "Logic (Verilator)",
          status: "Running",
          duration: "0s",
          date: new Date().toISOString(),
          verilog: verilogCode
        })
      });

      const newRun = await createResponse.json();

      // Add to local state immediately
      setRuns(prev => [newRun, ...prev]);
      setSelectedRun(newRun.id);

      // Now actually call the VLSI simulation service
      const startTime = Date.now();

      const simResponse = await fetch(`${VLSI_URL}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verilog: verilogCode })
      });

      const simData = await simResponse.json();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Update run with results
      const updatedStatus = simData.analysis?.status || "Passed";

      await fetch(`${BACKEND_URL}/api/runs/${newRun.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: updatedStatus,
          duration: `${duration}s`,
          analysis: simData.analysis || null
        })
      });

      // Update local state
      setRuns(prev =>
        prev.map(run =>
          run.id === newRun.id
            ? { ...run, status: updatedStatus, duration: `${duration}s`, analysis: simData.analysis }
            : run
        )
      );

      // Show waveform and analysis
      if (simData.waveform && simData.waveform.length > 0) {
        setWaveform(simData.waveform);
      }
      if (simData.analysis) {
        setAnalysis(simData.analysis);
      }

      // Also increment simulation count in stats
      try {
        await fetch(`${BACKEND_URL}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verilog: verilogCode })
        });
      } catch (e) {
        // Stats increment is best-effort
      }

    } catch (error) {
      console.error("Simulation error", error);
      setSimError("Could not connect to services. Make sure backend (8001) and VLSI tools (8003) are running.");
    } finally {
      setSimulating(false);
    }
  };


  const handleViewWaveform = async (runId: string) => {
    const run = runs.find(r => r.id === runId);
    if (!run) return;

    setSelectedRun(runId);
    setSimError("");
    setWaveform(null);
    setAnalysis(null);

    const codeToSimulate = run.verilog || verilogCode;

    if (!codeToSimulate || codeToSimulate.trim() === "") {
      setSimError("No Verilog code available for this run.");
      return;
    }

    try {
      const response = await fetch(`${VLSI_URL}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verilog: codeToSimulate })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      if (data.waveform && data.waveform.length > 0) {
        setWaveform(data.waveform);
      } else {
        setSimError("No waveform data returned. Check your Verilog code.");
      }

      if (data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Simulation error", error);
      setSimError("Could not connect to VLSI Tools service. Make sure it's running on port 8003.");
    }
  };


  const deleteRun = async (runId: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/runs/${runId}`, { method: "DELETE" });
      setRuns(prev => prev.filter(r => r.id !== runId));

      if (selectedRun === runId) {
        setWaveform(null);
        setAnalysis(null);
        setSelectedRun(null);
      }
    } catch (error) {
      console.error("Failed to delete run:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Passed":
        return <CheckCircle2 className="w-4 h-4 mr-1" />;
      case "Warning":
        return <AlertTriangle className="w-4 h-4 mr-1" />;
      case "Failed":
        return <XCircle className="w-4 h-4 mr-1" />;
      default:
        return <Clock className="w-4 h-4 mr-1" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Passed": return "text-green-400";
      case "Warning": return "text-yellow-400";
      case "Failed": return "text-red-400";
      default: return "text-slate-400";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      <div className="flex justify-between">
        <h1 className="text-3xl font-bold text-white">
          Simulation Environment
        </h1>

        <Button
          onClick={startSimulation}
          className="bg-cyan-600 hover:bg-cyan-500"
          disabled={simulating}
        >
          {simulating ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              Simulating...
            </>
          ) : (
            <>
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Simulation
            </>
          )}
        </Button>
      </div>


      {/* Manual Verilog Input */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Manual Verilog Input</CardTitle>
          <CardDescription>
            Paste Verilog manually or send from AI Designer
          </CardDescription>
        </CardHeader>

        <CardContent>
          <textarea
            className="w-full h-40 bg-black text-emerald-400 p-4 rounded text-xs font-mono"
            placeholder="Paste Verilog code here..."
            value={verilogCode}
            onChange={(e) => setVerilogCode(e.target.value)}
          />
        </CardContent>
      </Card>


      {/* Recent Runs */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
        </CardHeader>

        <CardContent>
          {/* Header */}
          <div className="grid grid-cols-6 text-slate-400 text-sm border-b border-slate-700 pb-2 mb-3">
            <div>Design</div>
            <div>Type</div>
            <div>Status</div>
            <div>Duration</div>
            <div>Date</div>
            <div className="text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {runs.length === 0 && (
              <div className="text-slate-500 text-center py-8">
                No simulation runs yet. Start a simulation above.
              </div>
            )}

            {runs.map((run) => (
              <div
                key={run.id}
                className={`grid grid-cols-6 items-center bg-slate-800/40 p-3 rounded transition-colors ${selectedRun === run.id ? 'ring-1 ring-cyan-500/50' : ''}`}
              >
                <div className="font-mono text-cyan-400">
                  {run.name}
                </div>

                <div>{run.type}</div>

                <div>
                  <span className={`flex items-center ${getStatusColor(run.status)}`}>
                    {getStatusIcon(run.status)}
                    {run.status}
                  </span>
                </div>

                <div>{run.duration}</div>
                <div className="text-sm">
                  {run.date ? new Date(run.date).toLocaleString() : "—"}
                </div>

                <div className="text-right flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                    onClick={() => handleViewWaveform(run.id)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRun(run.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Analysis Results */}
      {analysis && (
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h2 className="text-xl mb-4 text-white font-semibold flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Simulation Analysis Results
          </h2>
          <AnalysisPanel analysis={analysis} />
        </Card>
      )}


      {/* Waveform Viewer */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h2 className="text-xl mb-6 text-white font-semibold">
          Waveform Viewer
        </h2>

        {/* Error display */}
        {simError && (
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{simError}</span>
          </div>
        )}

        {!waveform && !simError && (
          <div className="text-slate-500 text-center py-20">
            Run a simulation or click &quot;View&quot; on a run to see its waveform
          </div>
        )}

        {waveform && (
          <div className="space-y-1 bg-slate-950/50 rounded-lg p-4 border border-slate-800">
            {/* Legend */}
            <div className="flex gap-6 text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-cyan-500" /> Logic High (1)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-6 h-0.5 bg-cyan-500 opacity-30" /> Logic Low (0)
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-500 opacity-60" /> Transition
              </span>
            </div>

            {waveform.map((signal: any, index: number) => (
              <WaveformSVG key={index} signal={signal} index={index} />
            ))}

            {/* Time axis */}
            <TimeAxis count={waveform[0]?.values?.length || 16} />
          </div>
        )}
      </Card>
    </div>
  );
}