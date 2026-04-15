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

export const mockCards: Card[] = [
  {
    id: "card-1",
    name: "Platinum",
    lastFour: "4821",
    brand: "Visa",
    limit: 15000,
    used: 4230.5,
    gradient: "credit-card-gradient-1",
    password: "1234",
  },
  {
    id: "card-2",
    name: "Gold",
    lastFour: "7392",
    brand: "Mastercard",
    limit: 8000,
    used: 2150.75,
    gradient: "credit-card-gradient-2",
    password: "5678",
  },
  {
    id: "card-3",
    name: "Black",
    lastFour: "0156",
    brand: "Visa",
    limit: 50000,
    used: 12340.0,
    gradient: "credit-card-gradient-3",
    password: "9012",
  },
];

const categories = [
  { name: "Food & Dining", icon: "🍔" },
  { name: "Shopping", icon: "🛍️" },
  { name: "Transport", icon: "🚗" },
  { name: "Entertainment", icon: "🎬" },
  { name: "Health", icon: "💊" },
  { name: "Bills", icon: "📄" },
  { name: "Travel", icon: "✈️" },
  { name: "Groceries", icon: "🛒" },
];

function randomTransactions(cardId: string, count: number, month: number, year: number): Transaction[] {
  const merchants: Record<string, string[]> = {
    "Food & Dining": ["Starbucks", "McDonald's", "Uber Eats", "DoorDash", "Chipotle"],
    Shopping: ["Amazon", "Nike", "Apple Store", "Zara", "Target"],
    Transport: ["Uber", "Lyft", "Shell Gas", "Parking Co", "Metro"],
    Entertainment: ["Netflix", "Spotify", "Steam", "Cinema", "Disney+"],
    Health: ["CVS Pharmacy", "Gym Pro", "Dr. Smith", "Walgreens"],
    Bills: ["Electric Co", "Water Utility", "Internet ISP", "Phone Plan"],
    Travel: ["Airbnb", "Delta Airlines", "Hilton Hotels", "Booking.com"],
    Groceries: ["Whole Foods", "Trader Joe's", "Costco", "Walmart"],
  };

  return Array.from({ length: count }, (_, i) => {
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const merch = merchants[cat.name];
    return {
      id: `tx-${cardId}-${month}-${i}`,
      cardId,
      merchant: merch[Math.floor(Math.random() * merch.length)],
      amount: Math.round((Math.random() * 300 + 5) * 100) / 100,
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
      month: "March",
      year: 2026,
      total: 0,
      dueDate: "2026-04-10",
      status: "paid" as const,
      transactions: randomTransactions(card.id, 15, 3, 2026),
    },
    {
      id: `inv-${card.id}-2026-04`,
      cardId: card.id,
      month: "April",
      year: 2026,
      total: 0,
      dueDate: "2026-05-10",
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
