import { useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Wallet,
} from "lucide-react";
import { callMCPTool, type Summary, type Transaction } from "./lib/mcpClient";
import SummaryCard from "./components/SummaryCard";
import PieChart from "./components/PieChart";
import TransactionList from "./components/TransactionList";
import TransactionForm from "./components/TransactionForm";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function getMonthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

export default function App() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const monthKey = getMonthKey(selectedYear, selectedMonth);

  const fetchData = useCallback(async () => {
    setError("");
    setLoadingTx(true);
    setLoadingSummary(true);
    try {
      const [txData, summaryData] = await Promise.all([
        callMCPTool("get_transactions", { month: monthKey }) as Promise<Transaction[]>,
        callMCPTool("get_summary", { month: monthKey }) as Promise<Summary>,
      ]);
      setTransactions(txData);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sunucuya bağlanılamadı");
    } finally {
      setLoadingTx(false);
      setLoadingSummary(false);
    }
  }, [monthKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const prevMonth = () => {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 236,
        flexShrink: 0,
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        padding: "0",
      }}>

        {/* Logo */}
        <div style={{ padding: "28px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "var(--accent-gold-dim)",
              border: "1px solid var(--accent-gold-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Wallet size={17} color="var(--accent-gold)" />
            </div>
            <div>
              <div className="serif" style={{ fontSize: "1.1rem", color: "var(--accent-gold)", lineHeight: 1.1 }}>
                Finans
              </div>
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Takip Paneli
              </div>
            </div>
          </div>
        </div>

        <hr className="divider" style={{ margin: "0 20px" }} />

        {/* Nav */}
        <nav style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          <button className="sidebar-item active">
            <LayoutDashboard size={16} />
            Genel Bakış
          </button>
          <button className="sidebar-item">
            <TrendingUp size={16} />
            Analiz
          </button>
          <button className="sidebar-item">
            <List size={16} />
            İşlemler
          </button>
          <button className="sidebar-item">
            <Settings size={16} />
            Ayarlar
          </button>
        </nav>

        <hr className="divider" style={{ margin: "0 20px" }} />

        {/* Month Navigator */}
        <div style={{ padding: "16px 12px", flex: 1 }}>
          <div style={{ padding: "0 4px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="stat-label">Dönem</span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button onClick={() => setSelectedYear(y => y - 1)} className="btn-ghost" style={{ padding: "3px 7px", fontSize: "0.72rem" }}>
                {selectedYear - 1}
              </button>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--accent-gold)" }}>{selectedYear}</span>
              <button onClick={() => setSelectedYear(y => y + 1)} className="btn-ghost" style={{ padding: "3px 7px", fontSize: "0.72rem" }}>
                {selectedYear + 1}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {MONTHS.map((m, i) => {
              const isActive = selectedMonth === i;
              const isCurrent = i === now.getMonth() && selectedYear === now.getFullYear();
              return (
                <button
                  key={m}
                  className={`month-btn ${isActive ? "active" : ""}`}
                  onClick={() => setSelectedMonth(i)}
                >
                  <span>{m}</span>
                  {isCurrent && !isActive && (
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: "var(--accent-emerald)",
                      display: "inline-block"
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom version */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>v1.0.0 · MCP Entegre</div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          padding: "16px 28px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={prevMonth} className="btn-ghost" style={{ padding: "6px 8px" }}>
              <ChevronLeft size={15} />
            </button>
            <div>
              <h2 className="serif" style={{ fontSize: "1.3rem", color: "var(--text-primary)", lineHeight: 1 }}>
                {MONTHS[selectedMonth]} {selectedYear}
              </h2>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 2 }}>
                {transactions.length} işlem · {monthKey}
              </p>
            </div>
            <button onClick={nextMonth} className="btn-ghost" style={{ padding: "6px 8px" }}>
              <ChevronRight size={15} />
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {error && (
              <span style={{ fontSize: "0.78rem", color: "var(--accent-rose)", background: "var(--accent-rose-dim)", padding: "5px 12px", borderRadius: 8 }}>
                Sunucuya bağlanılamadı
              </span>
            )}
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={15} />
              İşlem Ekle
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Summary Cards */}
          <SummaryCard summary={summary} loading={loadingSummary} />

          {/* Bottom row */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "380px 1fr",
            gap: 20,
            flex: 1,
            minHeight: 400,
          }}>
            <PieChart summary={summary} loading={loadingSummary} />
            <TransactionList transactions={transactions} loading={loadingTx} onDelete={fetchData} />
          </div>
        </div>
      </main>

      {showForm && (
        <TransactionForm onClose={() => setShowForm(false)} onSuccess={fetchData} />
      )}
    </div>
  );
}
