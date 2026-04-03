const MCP_BASE_URL = "http://localhost:3001";

export async function callMCPTool(toolName: string, args: Record<string, unknown>) {
  const response = await fetch(`${MCP_BASE_URL}/tools/${toolName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: "Bilinmeyen hata" }));
    throw new Error(err.error || `MCP aracı başarısız: ${toolName}`);
  }
  return response.json();
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

export interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { category: string; amount: number; type: string }[];
}

export const formatTL = (amount: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
