"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Briefcase, Key, ShieldCheck } from "lucide-react";

export default function ProfilePage() {

  const [user, setUser] = useState<any>(null);

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    fetch("http://localhost:8001/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setUser(data));

  }, []);


  const initials =
    user?.name?.split(" ")
      .map((n: string) => n[0])
      .join("") || "NA";


  const firstName = user?.name?.split(" ")[0] || "";
  const lastName = user?.name?.split(" ")[1] || "";


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Engineer Profile</h1>
        <p className="text-slate-400 mt-1">
          Manage your personal information, workspace access, and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Profile Identity Card */}
        <Card className="col-span-1 md:col-span-1 bg-slate-900/60 border-slate-800 backdrop-blur-xl">
          <CardContent className="pt-6 flex flex-col items-center text-center space-y-4">

            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center text-3xl font-bold text-cyan-400">
              {initials}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-100">
                {user?.name || "Engineer"}
              </h2>

              <p className="text-sm text-slate-400 flex items-center justify-center gap-1 mt-1">
                <Briefcase className="w-3 h-3" />
                {user?.role || "VLSI Engineer"}
              </p>
            </div>

            <div className="w-full pt-4 border-t border-slate-800 flex justify-between px-2">

              <div className="text-center">
                <div className="text-lg font-bold text-emerald-400">
                  {user?.simulations || 0}
                </div>
                <div className="text-xs text-slate-500">Simulations</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-cyan-400">
                  {user?.designs || 0}
                </div>
                <div className="text-xs text-slate-500">Designs</div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-fuchsia-400">Top 5%</div>
                <div className="text-xs text-slate-500">Efficiency</div>
              </div>

            </div>
          </CardContent>
        </Card>


        {/* Profile Details */}
        <Card className="col-span-1 md:col-span-2 bg-slate-900/60 border-slate-800 backdrop-blur-xl">

          <CardHeader>
            <CardTitle className="text-xl text-slate-200">
              Personal Information
            </CardTitle>

            <CardDescription className="text-slate-400">
              Update your account details and roles.
            </CardDescription>
          </CardHeader>


          <CardContent className="space-y-4">

            <div className="grid grid-cols-2 gap-4">

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-500" />
                  First Name
                </label>

                <Input
                  value={firstName}
                  readOnly
                  className="bg-slate-950/50 border-slate-700 text-slate-200"
                />
              </div>


              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Last Name
                </label>

                <Input
                  value={lastName}
                  readOnly
                  className="bg-slate-950/50 border-slate-700 text-slate-200"
                />
              </div>

            </div>


            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                Work Email
              </label>

              <Input
                value={user?.email || ""}
                readOnly
                className="bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed"
              />
            </div>


            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Workspace Permissions
              </label>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
                You have <strong>Full Access</strong> to AI Design,
                Simulation, and Analytics modules.
              </div>
            </div>


            <div className="flex justify-end gap-3 pt-6">
              <Button variant="outline">
                Discard Changes
              </Button>

              <Button className="bg-cyan-600 hover:bg-cyan-500">
                Save Profile
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>


      {/* API Keys */}

      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl mt-6">

        <CardHeader>
          <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Security & API Keys
          </CardTitle>

          <CardDescription className="text-slate-400">
            Manage your API access
          </CardDescription>

        </CardHeader>


        <CardContent>

          <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-lg">

            <div>
              <h4 className="font-medium text-slate-200">
                Main Production Key
              </h4>

              <p className="text-sm text-slate-500 font-mono mt-1">
                qk_live_2026_*******************
              </p>

            </div>

            <div className="flex gap-2 mt-4 md:mt-0">

              <Button variant="outline" size="sm">
                Rotate Key
              </Button>

              <Button size="sm">
                Copy
              </Button>

            </div>

          </div>

        </CardContent>

      </Card>

    </div>
  );
}