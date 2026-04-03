import { useState } from "react";
import { Trash2, ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";
import { callMCPTool, formatTL, type Transaction } from "../lib/mcpClient";

interface Props {
  transactions: Transaction[];
  loading: boolean;
  onDelete: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Kira: "#6366F1",
  Market: "#22D3EE",
  Faturalar: "#F97316",
  Ulaşım: "#A78BFA",
  Sağlık: "#34D399",
  Eğlence: "#FBBF24",
  Restoran: "#FB7185",
  Giyim: "#F43F5E",
  Eğitim: "#10B981",
  Maaş: "#10B981",
  Freelance: "#F5C842",
  Yatırım: "#6366F1",
  "Kira Geliri": "#22D3EE",
  İkramiye: "#F97316",
  Diğer: "#6B7280",
};

function getCategoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#6B7280";
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("tr-TR", { day: "2-digit", month: "short" });
}

export default function TransactionList({ transactions, loading, onDelete }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await callMCPTool("delete_transaction", { id });
      onDelete();
    } catch (err) {
      console.error("Silme hatası:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Header */}
      <div style={{
        padding: "18px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Receipt size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)" }}>
            İşlem Geçmişi
          </span>
        </div>
        <span style={{
          fontSize: "0.72rem",
          padding: "3px 10px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.05)",
          color: "var(--text-secondary)",
          border: "1px solid var(--border)",
        }}>
          {transactions.length} kayıt
        </span>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} className="skeleton" style={{ height: 52, borderRadius: 10 }} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-muted)",
          gap: 12,
          padding: 40,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Receipt size={24} style={{ opacity: 0.3 }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 500, marginBottom: 4 }}>İşlem bulunamadı</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Bu dönem için kayıt bulunmuyor</p>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "70px 1fr 1fr 80px 110px 40px",
            padding: "8px 20px",
            borderBottom: "1px solid var(--border)",
          }}>
            {["Tarih", "Açıklama", "Kategori", "Tür", "Tutar", ""].map((h) => (
              <div key={h} className="stat-label" style={{ fontSize: "0.65rem" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          {sorted.map((tx) => {
            const color = getCategoryColor(tx.category);
            const isDeleting = deletingId === tx.id;

            return (
              <div
                key={tx.id}
                className="tx-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr 1fr 80px 110px 40px",
                  padding: "11px 20px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                  opacity: isDeleting ? 0.4 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {/* Date */}
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {formatDate(tx.date)}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  paddingRight: 12,
                }}>
                  {tx.description}
                </div>

                {/* Category */}
                <div>
                  <span className="badge" style={{
                    background: `${color}18`,
                    color,
                    border: `1px solid ${color}30`,
                  }}>
                    {tx.category}
                  </span>
                </div>

                {/* Type */}
                <div>
                  <span className="badge" style={{
                    background: tx.type === "income" ? "var(--accent-emerald-dim)" : "var(--accent-rose-dim)",
                    color: tx.type === "income" ? "var(--accent-emerald)" : "var(--accent-rose)",
                    gap: 3,
                    display: "inline-flex",
                    alignItems: "center",
                  }}>
                    {tx.type === "income"
                      ? <ArrowUpRight size={10} />
                      : <ArrowDownLeft size={10} />}
                    {tx.type === "income" ? "Gelir" : "Gider"}
                  </span>
                </div>

                {/* Amount */}
                <div style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: tx.type === "income" ? "var(--accent-emerald)" : "var(--accent-rose)",
                  letterSpacing: "-0.01em",
                }}>
                  {tx.type === "income" ? "+" : "-"}{formatTL(tx.amount)}
                </div>

                {/* Delete */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={isDeleting}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: "transparent",
                      border: "1px solid transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--accent-rose-dim)";
                      e.currentTarget.style.borderColor = "rgba(244,63,94,0.2)";
                      e.currentTarget.style.color = "var(--accent-rose)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.borderColor = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    {isDeleting
                      ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                      : <Trash2 size={13} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
