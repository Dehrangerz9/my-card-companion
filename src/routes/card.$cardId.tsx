import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, EyeOff, Lock, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, PieChart as PieChartIcon,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
} from "recharts";
import { checkAuth } from "../lib/auth-store";
import { mockCards, mockInvoices, getCategoryBreakdown, type Invoice } from "../lib/mock-data";

export const Route = createFileRoute("/card/$cardId")({
  head: ({ params }) => {
    const card = mockCards.find((c) => c.id === params.cardId);
    return {
      meta: [
        { title: `${card?.name || "Card"} — CardVault` },
        { name: "description", content: `Manage your ${card?.name} card` },
      ],
    };
  },
  component: CardDetailPage,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Card not found</h1>
        <Link to="/dashboard" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  ),
});

const CHART_COLORS = [
  "oklch(0.75 0.15 180)",
  "oklch(0.65 0.2 330)",
  "oklch(0.7 0.18 155)",
  "oklch(0.8 0.16 80)",
  "oklch(0.7 0.14 240)",
  "oklch(0.75 0.18 50)",
  "oklch(0.6 0.15 290)",
  "oklch(0.7 0.12 120)",
];

function CardDetailPage() {
  const { cardId } = Route.useParams();
  const navigate = useNavigate();
  const card = mockCards.find((c) => c.id === cardId);

  if (typeof window !== "undefined" && !checkAuth()) {
    navigate({ to: "/" });
    return null;
  }

  if (!card) {
    return null;
  }

  const invoices = mockInvoices.filter((inv) => inv.cardId === cardId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Link
            to="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg font-bold text-foreground">
            {card.name} •••• {card.lastFour}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* Card password section */}
        <PasswordSection card={card} />

        {/* Invoices */}
        {invoices.map((invoice) => (
          <InvoiceSection key={invoice.id} invoice={invoice} />
        ))}
      </main>
    </div>
  );
}

function PasswordSection({ card }: { card: typeof mockCards[0] }) {
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [currentPass, setCurrentPass] = useState(card.password);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (newPass.length === 4 && /^\d+$/.test(newPass)) {
      setCurrentPass(newPass);
      setEditing(false);
      setNewPass("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lock className="h-4 w-4 text-primary" />
        <h2 className="font-display text-base font-semibold text-foreground">Card Password</h2>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-mono text-lg tracking-widest text-foreground">
            {showPassword ? currentPass : "••••"}
          </span>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Change password
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              maxLength={4}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value.replace(/\D/g, ""))}
              placeholder="4 digits"
              className="w-20 rounded-lg border border-border bg-input px-2 py-1.5 text-center font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSave}
              disabled={newPass.length !== 4}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setNewPass(""); }}
              className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}

        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-success"
            >
              ✓ Password updated
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function InvoiceSection({ invoice }: { invoice: Invoice }) {
  const [expanded, setExpanded] = useState(invoice.status === "open");
  const categories = getCategoryBreakdown(invoice.transactions);
  const avgPerDay = invoice.total / 30;
  const topCategory = categories[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden rounded-xl"
    >
      {/* Invoice header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-foreground">
              {invoice.month} {invoice.year}
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                invoice.status === "paid"
                  ? "bg-success/15 text-success"
                  : invoice.status === "overdue"
                    ? "bg-destructive/15 text-destructive"
                    : "bg-primary/15 text-primary"
              }`}
            >
              {invoice.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Due {invoice.dueDate} · {invoice.transactions.length} transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-foreground">
            ${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border p-5 space-y-6">
              {/* Insights */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    Avg/day
                  </div>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    ${avgPerDay.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <TrendingDown className="h-3 w-3" />
                    Top category
                  </div>
                  <p className="mt-1 font-display text-sm font-bold text-foreground">
                    {topCategory?.icon} {topCategory?.name}
                  </p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PieChartIcon className="h-3 w-3" />
                    Categories
                  </div>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">
                    {categories.length}
                  </p>
                </div>
              </div>

              {/* Charts row */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Pie chart */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Spend by Category</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="total"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          strokeWidth={0}
                        >
                          {categories.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          contentStyle={{
                            background: "white",
                            border: "1px solid oklch(0.91 0.02 290)",
                            borderRadius: "8px",
                            color: "oklch(0.18 0.04 285)",
                            fontSize: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar chart */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Category Breakdown</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categories.slice(0, 5)} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          tick={{ fill: "oklch(0.55 0.03 285)", fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value) => `$${Number(value).toFixed(2)}`}
                          contentStyle={{
                            background: "white",
                            border: "1px solid oklch(0.91 0.02 290)",
                            borderRadius: "8px",
                            color: "oklch(0.18 0.04 285)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                          {categories.slice(0, 5).map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Category legend */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat, idx) => (
                  <span
                    key={cat.name}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1 text-xs text-foreground"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    {cat.icon} {cat.name} — ${cat.total.toFixed(2)} ({cat.count})
                  </span>
                ))}
              </div>

              {/* Transactions list */}
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Transactions</h4>
                <div className="space-y-1">
                  {invoice.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{tx.categoryIcon}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.merchant}</p>
                          <p className="text-xs text-muted-foreground">{tx.category} · {tx.date}</p>
                        </div>
                      </div>
                      <span className="font-mono text-sm font-medium text-foreground">
                        -${tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
