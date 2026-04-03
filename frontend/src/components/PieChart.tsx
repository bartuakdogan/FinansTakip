import { useState } from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { BarChart2 } from "lucide-react";
import { formatTL, type Summary } from "../lib/mcpClient";

const PALETTE = [
  "#F5C842", "#10B981", "#6366F1", "#F43F5E", "#F97316",
  "#22D3EE", "#A78BFA", "#FB7185", "#34D399", "#FBBF24",
];

interface Props {
  summary: Summary | null;
  loading: boolean;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="rgba(255,255,255,0.85)" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: "0.65rem", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function PieChart({ summary, loading }: Props) {
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  const data = (summary?.byCategory ?? [])
    .filter((c) => c.type === activeTab)
    .sort((a, b) => b.amount - a.amount);

  const total = data.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="card" style={{ padding: "22px", display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart2 size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Kategori Dağılımı
          </span>
        </div>

        <div style={{
          display: "flex",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: 3,
          gap: 2,
        }}>
          {(["expense", "income"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "4px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 500,
                background: activeTab === tab
                  ? tab === "expense" ? "var(--accent-rose)" : "var(--accent-emerald)"
                  : "transparent",
                color: activeTab === tab ? "#fff" : "var(--text-muted)",
                transition: "all 0.2s",
              }}
            >
              {tab === "expense" ? "Giderler" : "Gelirler"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
          <div className="skeleton" style={{ width: 160, height: 160, borderRadius: "50%", alignSelf: "center" }} />
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 24 }} />)}
        </div>
      ) : data.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={24} style={{ opacity: 0.3 }} />
          </div>
          <p style={{ fontSize: "0.85rem" }}>Bu dönem için veri yok</p>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Chart */}
          <div style={{ position: "relative", height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  dataKey="amount"
                  paddingAngle={2}
                  labelLine={false}
                  label={CustomLabel as unknown as boolean}
                >
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={PALETTE[i % PALETTE.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#182035",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    color: "#F1F5F9",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "0.82rem",
                    padding: "8px 12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                  }}
                  formatter={(value: number, name: string) => [formatTL(value), name]}
                  labelFormatter={() => ""}
                />
              </RechartsPie>
            </ResponsiveContainer>

            {/* Center label */}
            <div style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}>
              <div className="stat-label" style={{ fontSize: "0.65rem" }}>TOPLAM</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Serif Display', serif", marginTop: 2 }}>
                {formatTL(total)}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto" }}>
            {data.map((item, i) => {
              const pct = total > 0 ? ((item.amount / total) * 100).toFixed(1) : "0";
              const color = PALETTE[i % PALETTE.length];
              return (
                <div
                  key={item.category}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "7px 10px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid var(--border)",
                    transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: color,
                    flexShrink: 0,
                    boxShadow: `0 0 6px ${color}60`,
                  }} />
                  <span style={{ flex: 1, fontSize: "0.8rem", color: "var(--text-primary)" }}>
                    {item.category}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>%{pct}</span>
                  <span style={{ fontSize: "0.8rem", color, fontWeight: 600 }}>
                    {formatTL(item.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
