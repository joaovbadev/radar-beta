import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp, Building2, Phone, Globe, Hash } from "lucide-react";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#818cf8",
  "#c4b5fd",
  "#7c3aed",
  "#4f46e5",
  "#4338ca",
];

function StatCard({ icon: Icon, label, value, sub, color = "radar" }) {
  const colorMap = {
    radar: "bg-radar-600/15 text-radar-400",
    emerald: "bg-emerald-600/15 text-emerald-400",
    amber: "bg-amber-600/15 text-amber-400",
    pink: "bg-pink-600/15 text-pink-400",
  };
  return (
    <div className="card p-3 flex items-center gap-3">
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}
      >
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{label}</p>
        {sub && <p className="text-xs text-slate-600 truncate">{sub}</p>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 truncate max-w-[160px]">{label}</p>
      <p className="text-sm font-bold text-radar-300">
        {payload[0].value} locais
      </p>
    </div>
  );
};

export default function OpportunityRadar({ locations, total }) {
  const stats = useMemo(() => {
    const n = locations.length;
    const withPhone = locations.filter((l) => l.telefone?.trim()).length;
    const withSite = locations.filter((l) => l.website?.trim()).length;
    const withSocial = locations.filter(
      (l) => l.instagram || l.facebook || l.tiktok || l.youtube || l.linkedin,
    ).length;

    // Group by neighbourhood extracted from address
    const byHood = {};
    for (const loc of locations) {
      const parts = (loc.endereco || "").split(",").map((s) => s.trim());
      // Brazilian address: "Rua X, Nº, Bairro, Cidade — CE"
      const hood = parts[2] || parts[1] || "Outros";
      const key = hood.length < 35 ? hood : "Outros";
      byHood[key] = (byHood[key] || 0) + 1;
    }

    const neighborhoods = Object.entries(byHood)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    return { n, withPhone, withSite, withSocial, neighborhoods };
  }, [locations]);

  if (locations.length === 0) return null;

  const pPhone =
    stats.n > 0 ? Math.round((stats.withPhone / stats.n) * 100) : 0;
  const pSite = stats.n > 0 ? Math.round((stats.withSite / stats.n) * 100) : 0;
  const pSocial =
    stats.n > 0 ? Math.round((stats.withSocial / stats.n) * 100) : 0;

  const isFiltered = total != null && total !== stats.n;

  return (
    <div className="absolute bottom-5 left-5 z-[999] w-100 space-y-3 pointer-events-none">
      {/* Stats card */}
      <div className="card p-3 pointer-events-auto">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={14} className="text-radar-400" />
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Opportunity Radar
          </h3>
          <span className="ml-auto tag bg-radar-600/20 text-radar-300">
            {stats.n}
            {isFiltered ? ` / ${total}` : ""} locais
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={Phone}
            label="Com telefone"
            value={`${pPhone}%`}
            sub={`${stats.withPhone} locais`}
            color="emerald"
          />
          <StatCard
            icon={Globe}
            label="Com website"
            value={`${pSite}%`}
            sub={`${stats.withSite} locais`}
            color="radar"
          />
          <StatCard
            icon={Hash}
            label="Com social"
            value={`${pSocial}%`}
            sub={`${stats.withSocial} locais`}
            color="pink"
          />
          <StatCard
            icon={Building2}
            label="Total"
            value={stats.n}
            sub="empresas"
            color="amber"
          />
        </div>
      </div>

      {/* Neighbourhood bar chart */}
      {/* {stats.neighborhoods.length > 1 && (
        <div className="card p-3 pointer-events-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Top Regiões
          </p>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={stats.neighborhoods} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "#64748b" }}
                interval={0}
                angle={-25}
                textAnchor="end"
                height={38}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {stats.neighborhoods.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )} */}
    </div>
  );
}
