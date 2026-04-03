import { useState } from "react";
import { X, ArrowDownLeft, ArrowUpRight, Tag, DollarSign, FileText, Calendar, Loader2 } from "lucide-react";
import { callMCPTool } from "../lib/mcpClient";

const EXPENSE_CATEGORIES = [
  "Kira", "Market", "Faturalar", "Ulaşım", "Sağlık",
  "Eğlence", "Restoran", "Giyim", "Eğitim", "Diğer",
];
const INCOME_CATEGORIES = [
  "Maaş", "Freelance", "Yatırım", "Kira Geliri", "İkramiye", "Diğer",
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionForm({ onClose, onSuccess }: Props) {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const finalCategory = category === "Diğer" ? customCategory : category;

  const isExpense = type === "expense";
  const accentColor = isExpense ? "var(--accent-rose)" : "var(--accent-emerald)";
  const accentDim = isExpense ? "var(--accent-rose-dim)" : "var(--accent-emerald-dim)";
  const accentBorder = isExpense ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.2)";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!finalCategory.trim()) { setError("Kategori seçiniz"); return; }
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) { setError("Geçerli bir miktar giriniz"); return; }
    if (!description.trim()) { setError("Açıklama giriniz"); return; }
    if (!date) { setError("Tarih seçiniz"); return; }

    try {
      setLoading(true);
      await callMCPTool("add_transaction", {
        type, category: finalCategory.trim(),
        amount: parsedAmount, description: description.trim(), date,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="card modal-content"
        style={{
          width: "100%",
          maxWidth: 460,
          border: `1px solid ${accentBorder}`,
          overflow: "hidden",
        }}
      >
        {/* Header stripe */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${accentColor}, transparent)`,
        }} />

        <div style={{ padding: "24px 24px 28px" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: accentDim,
                border: `1px solid ${accentBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {isExpense
                  ? <ArrowDownLeft size={16} color={accentColor} />
                  : <ArrowUpRight size={16} color={accentColor} />}
              </div>
              <div>
                <h2 className="serif" style={{ fontSize: "1.05rem", color: "var(--text-primary)", lineHeight: 1.1 }}>
                  İşlem Ekle
                </h2>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 1 }}>
                  Yeni bir işlem kaydı oluştur
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Type toggle */}
          <div className="type-toggle" style={{ marginBottom: 20 }}>
            {(["expense", "income"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setCategory(""); }}
                className="type-toggle-btn"
                style={{
                  background: type === t
                    ? t === "expense" ? "var(--accent-rose)" : "var(--accent-emerald)"
                    : "transparent",
                  color: type === t ? "#fff" : "var(--text-muted)",
                }}
              >
                {t === "expense" ? "Gider" : "Gelir"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Category */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                <Tag size={12} /> Kategori
              </label>
              <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Seçiniz...</option>
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {category === "Diğer" && (
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                  <Tag size={12} /> Özel Kategori
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Kategori adı..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              </div>
            )}

            {/* Amount */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                <DollarSign size={12} /> Miktar (₺)
              </label>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600,
                }}>₺</span>
                <input
                  className="form-input"
                  type="text"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ""))}
                  style={{ paddingLeft: 28 }}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                <FileText size={12} /> Açıklama
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="İşlem açıklaması..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Date */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                <Calendar size={12} /> Tarih
              </label>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ colorScheme: "dark" }}
              />
            </div>

            {error && (
              <div style={{
                padding: "9px 12px",
                background: "var(--accent-rose-dim)",
                border: "1px solid rgba(244,63,94,0.2)",
                borderRadius: 8,
                fontSize: "0.8rem",
                color: "var(--accent-rose)",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-ghost"
                style={{ flex: "0 0 auto", padding: "10px 18px" }}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1, background: accentColor }}
              >
                {loading ? (
                  <><Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} /> Kaydediliyor...</>
                ) : (
                  "Kaydet"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
