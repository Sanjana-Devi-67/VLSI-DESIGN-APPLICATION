"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileType, CheckCircle } from "lucide-react";

export default function AnalyticsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<{defects: number, power: string, timing: string} | null>(null);

  const handleUpload = () => {
    if (!file) return;
    setAnalyzing(true);
    setTimeout(() => {
      setResults({
        defects: 42,
        power: "1.2mW (-15% vs baseline)",
        timing: "400ps (Met Constraints)",
      });
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight">Semiconductor Analytics</h1>
        <p className="text-slate-400 mt-1">Upload sensor data or design specs to predict defects and optimize power.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-200">Data Upload</CardTitle>
            <CardDescription className="text-slate-400">Supported formats: CSV, JSON, VCD</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-700 rounded-lg p-10 flex flex-col items-center justify-center bg-slate-950/50 hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => document.getElementById("file-upload")?.click()}>
              <input type="file" id="file-upload" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              <UploadCloud className="w-10 h-10 text-cyan-500 mb-4" />
              <p className="text-slate-300 font-medium">Click to upload or drag and drop</p>
              <p className="text-slate-500 text-sm mt-1">{file ? file.name : "No file selected"}</p>
            </div>
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              disabled={!file || analyzing}
              onClick={handleUpload}
            >
              {analyzing ? "Analyzing Models..." : "Run Analysis"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-200">Prediction Results</CardTitle>
            <CardDescription className="text-slate-400">LightGBM & Neural Network Outputs</CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-4 mt-6">
                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50 border border-slate-700">
                  <div className="text-slate-400">Defects Detected</div>
                  <div className="text-xl font-bold text-red-400">{results.defects}</div>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50 border border-slate-700">
                  <div className="text-slate-400">Power Estimation</div>
                  <div className="text-lg font-bold text-yellow-400">{results.power}</div>
                </div>
                <div className="flex justify-between items-center p-3 rounded bg-slate-800/50 border border-slate-700">
                  <div className="text-slate-400">Timing Prediction</div>
                  <div className="text-lg font-bold text-emerald-400">{results.timing}</div>
                </div>
                <div className="pt-4 flex items-center text-emerald-500">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-medium">Analysis Complete</span>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[200px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <FileType className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Upload data to see predictions</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
