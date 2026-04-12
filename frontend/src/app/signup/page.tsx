"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function SignupPage() {
  const [formData, setFormData] = useState({ 
    first_name: "", 
    last_name: "", 
    email: "", 
    password: "",
    role: "" 
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.first_name || !formData.password) {
      toast.error("First name, email, and password are required");
      return;
    }

    setLoading(true);
    try {
      // Combine first + last name for the backend
      const name = `${formData.first_name} ${formData.last_name}`.trim();
      
      const res = await fetch("http://127.0.0.1:8001/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name,
          email: formData.email, 
          password: formData.password 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Store token and user data
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        toast.success("Account created successfully!", {
          description: `Welcome to QANTYX, ${formData.first_name}!`
        });
        router.push("/dashboard");
      } else {
        const error = await res.json();
        toast.error(error.detail || "Signup failed. Please try again.");
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
        className="w-full max-w-lg mt-12"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 cursor-pointer hover:opacity-80 transition-opacity">
          <Logo className="w-64 h-24 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
        </Link>
        
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white text-center">Sign Up</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              Create your engineering workspace account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">First Name</label>
                  <Input 
                    id="firstName" 
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    placeholder="Ada" 
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-fuchsia-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Last Name</label>
                  <Input 
                    id="lastName" 
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    placeholder="Lovelace" 
                    className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-fuchsia-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Work Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="ada@qantyx.com" 
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-fuchsia-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <Input 
                  id="password" 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Create a strong password" 
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-fuchsia-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role / Department</label>
                <Input 
                  id="role" 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="VLSI Design Engineer" 
                  className="bg-slate-950/50 border-slate-700 text-slate-200 focus-visible:ring-fuchsia-500"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-fuchsia-600 hover:from-cyan-500 hover:to-fuchsia-500 text-white font-semibold border-0">
                {loading ? "Creating Account..." : "Sign Up"}
              </Button>
              <div className="text-center text-sm text-slate-500">
                Already have an account? <Link href="/login" className="text-cyan-400 hover:underline">Sign In</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
