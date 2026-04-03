import "dotenv/config";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

const app = express();
app.use(cors());
app.use(express.json());

// POST /tools/add_transaction
app.post("/tools/add_transaction", async (req, res) => {
  const { type, category, amount, description, date } = req.body as {
    type: "income" | "expense";
    category: string;
    amount: number;
    description: string;
    date: string;
  };

  if (!type || !category || amount === undefined || !description || !date) {
    return res.status(400).json({ error: "Eksik parametre" });
  }
  if (amount <= 0) {
    return res.status(400).json({ error: "Miktar sıfırdan büyük olmalıdır" });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({ id: randomUUID(), type, category, amount, description, date })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true, transaction: data });
});

// POST /tools/get_transactions
app.post("/tools/get_transactions", async (req, res) => {
  const { type, month } = req.body as {
    type?: "income" | "expense";
    month?: string;
  };

  let query = supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  if (type) query = query.eq("type", type);
  if (month) {
    const [year, mon] = month.split("-");
    const start = `${year}-${mon}-01`;
    const end = `${year}-${mon}-31`;
    query = query.gte("date", start).lte("date", end);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /tools/delete_transaction
app.post("/tools/delete_transaction", async (req, res) => {
  const { id } = req.body as { id: string };

  if (!id) return res.status(400).json({ error: "ID gerekli" });

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ success: true });
});

// POST /tools/get_summary
app.post("/tools/get_summary", async (req, res) => {
  const { month } = req.body as { month?: string };

  let query = supabase.from("transactions").select("*");

  if (month) {
    const [year, mon] = month.split("-");
    query = query.gte("date", `${year}-${mon}-01`).lte("date", `${year}-${mon}-31`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const transactions = data as Transaction[];

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const categoryMap = new Map<string, { amount: number; type: string }>();
  for (const t of transactions) {
    const existing = categoryMap.get(t.category);
    if (existing) {
      existing.amount += t.amount;
    } else {
      categoryMap.set(t.category, { amount: t.amount, type: t.type });
    }
  }

  const byCategory = Array.from(categoryMap.entries()).map(([category, d]) => ({
    category,
    amount: d.amount,
    type: d.type,
  }));

  return res.json({ totalIncome, totalExpense, balance: totalIncome - totalExpense, byCategory });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Finans MCP Sunucusu http://localhost:${PORT} üzerinde çalışıyor`);
});
