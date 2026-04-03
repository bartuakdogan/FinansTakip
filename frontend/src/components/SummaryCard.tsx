import { useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Scale } from "lucide-react";
import { formatTL, type Summary } from "../lib/mcpClient";

interface Props {
  summary: Summary | null;
  loading: boolean;
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    prevValue.current = value;
    const duration = 900;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return <span>{prefix}{formatTL(display)}</span>;
}

interface CardConfig {
  key: keyof Pick<Summary, "totalIncome" | "totalExpense" | "balance">;
  label: string;
  sublabel: string;
  color: string;
  dimColor: string;
  borderColor: string;
  Icon: React.ElementType;
  sign?: string;
}

export default function SummaryCard({ summary, loading }: Props) {
  const balance = summary?.balance ?? 0;

  const cards: CardConfig[] = [
    {
      key: "totalIncome",
      label: "Toplam Gelir",
      sublabel: "Bu ay gelen",
      color: "var(--accent-emerald)",
      dimColor: "var(--accent-emerald-dim)",
      borderColor: "rgba(16,185,129,0.2)",
      Icon: TrendingUp,
      sign: "+",
    },
    {
      key: "totalExpense",
      label: "Toplam Gider",
      sublabel: "Bu ay giden",
      color: "var(--accent-rose)",
      dimColor: "var(--accent-rose-dim)",
      borderColor: "rgba(244,63,94,0.2)",
      Icon: TrendingDown,
      sign: "-",
    },
    {
      key: "balance",
      label: "Net Bakiye",
      sublabel: balance >= 0 ? "Pozitif denge" : "Negatif denge",
      color: balance >= 0 ? "var(--accent-gold)" : "var(--accent-rose)",
      dimColor: balance >= 0 ? "var(--accent-gold-dim)" : "var(--accent-rose-dim)",
      borderColor: balance >= 0 ? "var(--accent-gold-border)" : "rgba(244,63,94,0.2)",
      Icon: Scale,
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
      {cards.map(({ key, label, sublabel, color, dimColor, borderColor, Icon, sign }) => {
        const value = summary?.[key] ?? 0;
        const pct = summary && summary.totalIncome > 0 && key === "totalExpense"
          ? ((summary.totalExpense / summary.totalIncome) * 100).toFixed(0)
          : null;

        return (
          <div
            key={key}
            className="card fade-in"
            style={{
              padding: "22px 24px",
              border: `1px solid ${borderColor}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Background glow */}
            <div style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: dimColor,
              filter: "blur(30px)",
              pointerEvents: "none",
            }} />

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <p className="stat-label">{label}</p>
                <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 2 }}>{sublabel}</p>
              </div>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: dimColor,
                border: `1px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Icon size={16} color={color} />
              </div>
            </div>

            {/* Amount */}
            <div style={{
              fontSize: "1.7rem",
              fontWeight: 700,
              color,
              fontFamily: "'DM Serif Display', serif",
              letterSpacing: "-0.02em",
              lineHeight: 1,
              marginBottom: 10,
            }}>
              {loading ? (
                <div className="skeleton" style={{ width: 130, height: 30 }} />
              ) : (
                <AnimatedNumber value={value} prefix={sign} />
              )}
            </div>

            {/* Footer bar */}
            {!loading && pct && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Gelirin %{pct}'i</span>
                </div>
                <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(Number(pct), 100)}%`,
                    background: color,
                    borderRadius: 2,
                    transition: "width 1s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                </div>
              </div>
            )}

            {!loading && key === "balance" && summary && (
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: 4 }}>
                {summary.totalIncome > 0
                  ? `Tasarruf oranı: %${((balance / summary.totalIncome) * 100).toFixed(0)}`
                  : "Veri yok"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
