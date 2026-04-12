"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast.success("Login successful!", {
          description: `Welcome back, ${data.user.name}!`
        });
        router.push("/dashboard");
      } else {
        const error = await res.json();
        toast.error(error.detail || "Invalid credentials");
      }
    } catch (error) {
      toast.error("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
          <Logo className="w-64 h-24 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
        </Link>
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white text-center">Engineer Login</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Enter your credentials to access the design platform
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Workspace</label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="eng@qantyx.com" 
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-cyan-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-cyan-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold">
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
              <div className="text-center text-sm text-slate-500">
                Don&apos;t have an account? <Link href="/signup" className="text-cyan-400 hover:underline">Sign Up</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
