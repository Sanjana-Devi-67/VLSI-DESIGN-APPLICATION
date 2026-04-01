import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  BarChart3,
  History,
  Cpu,
  Activity,
  Atom,
} from 'lucide-react';

import Dashboard from './pages/Dashboard';
import ManualPredictPage from './pages/Upload';
import UploadCSVPage from './pages/UploadCSV';
import Results from './pages/Results';
import HistoryPage from './pages/History';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  // { path: '/upload', label: 'Manual Input', icon: Upload },
  { path: '/upload-csv', label: 'CSV Upload', icon: Upload },
  { path: '/results', label: 'Predictions', icon: BarChart3 },
  { path: '/history', label: 'Analytics', icon: History },
];

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        {/* ── Sidebar ─────────────────────────────── */}
        <aside className="w-72 border-r border-dark-800/60 bg-dark-950/80 backdrop-blur-xl flex flex-col fixed h-full z-30">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-dark-800/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-neon-purple flex items-center justify-center shadow-glow-sm">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">SemiconAI</h1>
                <p className="text-[11px] text-dark-500 font-medium tracking-wide">DEFECT DETECTION</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="px-4 pb-6 space-y-3">
            {/* Status indicators */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-dark-400">
                  <Activity className="w-3.5 h-3.5" />
                  System Status
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="pulse-dot"></span>
                  <span className="text-emerald-400 text-xs font-medium">Online</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-dark-400">
                  <Atom className="w-3.5 h-3.5" />
                  Quantum Module
                </span>
                <span className="text-amber-400 text-xs font-medium">Standby</span>
              </div>
            </div>

            <p className="text-[10px] text-dark-600 text-center">
              v1.0.0 • SemiconAI Platform
            </p>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────── */}
        <main className="flex-1 ml-72">
          <div className="p-8 max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* <Route path="/upload" element={<ManualPredictPage />} /> */}
              <Route path="/upload-csv" element={<UploadCSVPage />} />
              <Route path="/results" element={<Results />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
