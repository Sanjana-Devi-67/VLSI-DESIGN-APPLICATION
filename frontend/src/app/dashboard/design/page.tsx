"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Zap, Loader2 } from "lucide-react";

export default function AIDesignPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("// Verilog code will appear here...");
  
  // ✅ UPDATED — Calls AI Engine Backend
  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);

    try {
      const response = await fetch("http://localhost:8001/design/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: prompt
        })
      });

      const data = await response.json();

      setGeneratedCode(data.verilog);

    } catch (error) {
      console.error(error);
      alert("Failed to generate design");
    }

    setIsGenerating(false);
  };


  const handleSendToSimulation = () => {

    if (!generatedCode || generatedCode.includes("Verilog code will appear")) {
      alert("Generate design first");
      return;
    }

    // Save code to localStorage
    localStorage.setItem("verilog_code", generatedCode);

    // Navigate to simulation page
    router.push("/dashboard/optimization")
  };


  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-row justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">AI VLSI Designer</h1>
          <p className="text-slate-400 mt-1">Generate and optimize Verilog using Large Language Models</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-200">Design Prompt</CardTitle>
            <CardDescription className="text-slate-400">Describe your circuit in natural language.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="w-full h-40 p-3 bg-slate-950/50 border border-slate-700 rounded-md text-sm text-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder-slate-600"
              placeholder="E.g., Design a 32-bit ALU that supports addition, subtraction, AND, and OR operations with a synchronous active-high reset."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-medium shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? "Generating..." : "Generate Verilog"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 bg-slate-900/60 border-slate-800 backdrop-blur-xl flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-800">
            <Tabs defaultValue="verilog" className="w-full relative">
              <TabsList className="bg-slate-950 border border-slate-800 absolute right-0 -top-12">
                <TabsTrigger value="verilog" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
                  Verilog
                </TabsTrigger>
                <TabsTrigger value="explanation" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
                  Explanation
                </TabsTrigger>
              </TabsList>
              <CardTitle className="text-xl text-slate-200 mt-2">Output Code</CardTitle>
            </Tabs>
          </CardHeader>

          <CardContent className="flex-1 p-0 mt-2">
            <div className="h-full bg-[#0d1117] rounded-b-xl border border-slate-800 p-4 font-mono text-sm overflow-y-auto">
              <pre className="text-emerald-400/90 whitespace-pre-wrap">
                {generatedCode}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button 
          variant="outline" 
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          Save Draft
        </Button>

        <Button 
          onClick={handleSendToSimulation}
          className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium shadow-[0_0_15px_rgba(217,70,239,0.3)]"
        >
          <Zap className="w-4 h-4 mr-2" />
          Send to Optimization
        </Button>

      </div>
    </div>
  );
}