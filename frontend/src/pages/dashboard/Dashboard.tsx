import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, FileText, ShieldAlert, Beaker, UserX } from "lucide-react";
import { PageHeading } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { scoreColor } from "@/lib/utils";
import {
  detectionTrends,
  languageAnalysis,
  overviewStats,
  plagiarismCategories,
  recentDocs,
  threatDistribution,
} from "@/data/mock";

const icons = [FileText, ShieldAlert, Beaker, UserX];

const tooltipStyle = {
  background: "rgba(11,11,11,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  fontSize: 12,
  color: "#D9D9D9",
};

export default function Dashboard() {
  return (
    <div>
      <PageHeading
        eyebrow="Intelligence Center"
        title="NuroAI Intelligence Center"
        description="Portfolio-wide authenticity signal across every detection layer."
        action={<Button>Export Report</Button>}
      />

      {/* Overview cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((s, i) => {
          const Icon = icons[i];
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card>
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-crimson/30 bg-crimson/10">
                    <Icon className="h-[18px] w-[18px] text-crimson-bright" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-0.5 font-mono text-xs ${
                      s.up ? "text-crimson-bright" : "text-emerald-400"
                    }`}
                  >
                    {s.up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {s.delta}
                  </span>
                </div>
                <p className="mt-4 font-display text-3xl font-extrabold text-silver-bright">{s.value}</p>
                <p className="mt-1 text-sm text-silver-dim">{s.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detection Trends</CardTitle>
            <Badge tone="red">8-week window</Badge>
          </CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={detectionTrends} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gAi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF1E1E" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#FF1E1E" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDirect" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D9D9D9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#D9D9D9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="#6f6f6f" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6f6f6f" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,30,30,0.3)" }} />
              <Area type="monotone" dataKey="ai" stroke="#FF1E1E" strokeWidth={2} fill="url(#gAi)" name="AI rewrites" />
              <Area type="monotone" dataKey="direct" stroke="#D9D9D9" strokeWidth={2} fill="url(#gDirect)" name="Direct" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Threat Distribution</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={threatDistribution}
                dataKey="value"
                nameKey="name"
                innerRadius={62}
                outerRadius={92}
                paddingAngle={3}
                stroke="none"
              >
                {threatDistribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {threatDistribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-silver-dim">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="font-mono text-silver">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Plagiarism Categories</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={plagiarismCategories} margin={{ left: -16, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="category" stroke="#6f6f6f" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6f6f6f" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="clean" stackId="a" fill="#2a2a2a" radius={[0, 0, 0, 0]} name="Clean" />
              <Bar dataKey="flagged" stackId="a" fill="#FF1E1E" radius={[4, 4, 0, 0]} name="Flagged" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Language Analysis</CardTitle>
          </CardHeader>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={languageAnalysis} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" stroke="#6f6f6f" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="lang" stroke="#6f6f6f" fontSize={12} tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
              <Bar dataKey="docs" radius={[0, 4, 4, 0]} name="Documents">
                {languageAnalysis.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? "#FF1E1E" : "#7a1d1d"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent docs */}
      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent Documents</CardTitle>
          <Badge>Live feed</Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left font-mono text-[11px] uppercase tracking-widest text-silver-dim">
                <th className="py-2.5 pr-4">ID</th>
                <th className="py-2.5 pr-4">Document</th>
                <th className="py-2.5 pr-4">Lang</th>
                <th className="py-2.5 pr-4">Risk</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentDocs.map((d) => (
                <tr key={d.id} className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]">
                  <td className="py-3 pr-4 font-mono text-xs text-silver-dim">{d.id}</td>
                  <td className="py-3 pr-4 text-silver-bright">{d.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-silver-dim">{d.lang}</td>
                  <td className="py-3 pr-4">
                    <span className="font-mono font-semibold" style={{ color: scoreColor(d.risk) }}>
                      {d.risk}
                    </span>
                  </td>
                  <td className="py-3">
                    <Badge tone={d.risk >= 75 ? "red" : d.risk >= 45 ? "amber" : "green"}>
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
