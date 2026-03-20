import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ShieldAlert, ShieldCheck, Search } from 'lucide-react';
import securityDataRaw from './security-data.json';

const defaultData = { summary: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, UNKNOWN: 0 }, tools: {}, vulnerabilities: [] };
const data = Object.keys(securityDataRaw).length > 0 ? securityDataRaw : defaultData;

const COLORS = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  UNKNOWN: '#94a3b8'
};

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const pieData = Object.entries(data.summary).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
  const barData = Object.entries(data.tools).map(([name, value]) => ({ name, value }));

  const filteredVulns = useMemo(() => {
    return data.vulnerabilities.filter(v => 
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      v.tool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const totalVulns = pieData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-3">
              <ShieldAlert className="w-10 h-10 text-emerald-400" />
              DevSecOps Dashboard
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Real-time vulnerability metrics across all integrated scanners.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl text-center shadow-lg">
              <div className="text-3xl font-black text-white">{totalVulns}</div>
              <div className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Total Issues</div>
            </div>
            <div className="bg-red-950/30 border border-red-900/50 px-6 py-4 rounded-2xl text-center shadow-lg">
              <div className="text-3xl font-black text-red-500">{data.summary.CRITICAL || 0}</div>
              <div className="text-sm text-red-500/70 uppercase tracking-wider font-semibold">Critical</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <h2 className="text-xl font-bold text-slate-300 mb-6">Severity Breakdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
            <h2 className="text-xl font-bold text-slate-300 mb-6">Detections by Scanner</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip cursor={{ fill: '#334155' }} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-200">Vulnerabilities Log</h2>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search rule ID, tool, or description..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200 transition-all placeholder:text-slate-600"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Priority</th>
                  <th className="px-6 py-4 font-semibold">Tool</th>
                  <th className="px-6 py-4 font-semibold">Identifier</th>
                  <th className="px-6 py-4 font-semibold">Target File</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredVulns.length > 0 ? filteredVulns.map((vuln, i) => (
                  <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        vuln.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        vuln.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                        vuln.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 
                        'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {vuln.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">{vuln.tool}</td>
                    <td className="px-6 py-4"><span className="font-mono text-emerald-400">{vuln.id}</span></td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-xs" title={vuln.file}>{vuln.file}</td>
                    <td className="px-6 py-4 truncate max-w-sm" title={vuln.message}>{vuln.message}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 text-lg">
                       <span className="opacity-70">No results match your exact search.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
