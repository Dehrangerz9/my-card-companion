export interface Card {
  id: string;
  name: string;
  lastFour: string;
  brand: "Visa" | "Mastercard";
  limit: number;
  used: number;
  gradient: string;
  password: string;
}

export interface Transaction {
  id: string;
  cardId: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  categoryIcon: string;
}

export interface Invoice {
  id: string;
  cardId: string;
  month: string;
  year: number;
  total: number;
  dueDate: string;
  status: "paid" | "open" | "overdue";
  transactions: Transaction[];
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const mockCards: Card[] = [
  {
    id: "card-1",
    name: "Platinum",
    lastFour: "4821",
    brand: "Visa",
    limit: 75000,
    used: 21152.5,
    gradient: "credit-card-gradient-1",
    password: "1234",
  },
  {
    id: "card-2",
    name: "Gold",
    lastFour: "7392",
    brand: "Mastercard",
    limit: 40000,
    used: 10753.75,
    gradient: "credit-card-gradient-2",
    password: "5678",
  },
  {
    id: "card-3",
    name: "Black",
    lastFour: "0156",
    brand: "Visa",
    limit: 250000,
    used: 61700.0,
    gradient: "credit-card-gradient-3",
    password: "9012",
  },
];

const categories = [
  { name: "Alimentação", icon: "🍔" },
  { name: "Compras", icon: "🛍️" },
  { name: "Transporte", icon: "🚗" },
  { name: "Entretenimento", icon: "🎬" },
  { name: "Saúde", icon: "💊" },
  { name: "Contas", icon: "📄" },
  { name: "Viagem", icon: "✈️" },
  { name: "Supermercado", icon: "🛒" },
];

function randomTransactions(cardId: string, count: number, month: number, year: number): Transaction[] {
  const merchants: Record<string, string[]> = {
    "Alimentação": ["Starbucks", "McDonald's", "iFood", "Rappi", "Outback"],
    "Compras": ["Amazon", "Nike", "Apple Store", "Zara", "Magazine Luiza"],
    "Transporte": ["Uber", "99", "Shell", "Estacionamento", "Metrô"],
    "Entretenimento": ["Netflix", "Spotify", "Steam", "Cinemark", "Disney+"],
    "Saúde": ["Drogasil", "Smart Fit", "Dr. Silva", "Droga Raia"],
    "Contas": ["Enel", "Sabesp", "Vivo Fibra", "Claro Celular"],
    "Viagem": ["Airbnb", "LATAM", "Ibis Hotel", "Booking.com"],
    "Supermercado": ["Pão de Açúcar", "Carrefour", "Assaí", "Extra"],
  };

  return Array.from({ length: count }, (_, i) => {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const merch = merchants[cat.name];
    return {
      id: `tx-${cardId}-${month}-${i}`,
      cardId,
      merchant: merch[Math.floor(Math.random() * merch.length)],
      amount: Math.round((Math.random() * 1500 + 25) * 100) / 100,
      date: `${year}-${String(month).padStart(2, "0")}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
      category: cat.name,
      categoryIcon: cat.icon,
    };
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export const mockInvoices: Invoice[] = mockCards.flatMap((card) => {
  return [
    {
      id: `inv-${card.id}-2026-03`,
      cardId: card.id,
      month: "Março",
      year: 2026,
      total: 0,
      dueDate: "10/04/2026",
      status: "paid" as const,
      transactions: randomTransactions(card.id, 15, 3, 2026),
    },
    {
      id: `inv-${card.id}-2026-04`,
      cardId: card.id,
      month: "Abril",
      year: 2026,
      total: 0,
      dueDate: "10/05/2026",
      status: "open" as const,
      transactions: randomTransactions(card.id, 12, 4, 2026),
    },
  ].map((inv) => ({
    ...inv,
    total: inv.transactions.reduce((s, t) => s + t.amount, 0),
  }));
});

export function getCategoryBreakdown(transactions: Transaction[]) {
  const map = new Map<string, { total: number; count: number; icon: string }>();
  for (const t of transactions) {
    const existing = map.get(t.category) || { total: 0, count: 0, icon: t.categoryIcon };
    existing.total += t.amount;
    existing.count += 1;
    map.set(t.category, existing);
  }
  return Array.from(map.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total);
}
