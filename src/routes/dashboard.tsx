import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { CreditCard, LogOut, ChevronRight, Wifi } from "lucide-react";
import { checkAuth, logout } from "../lib/auth-store";
import { mockCards } from "../lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CardVault" },
      { name: "description", content: "View and manage your credit cards" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();

  if (typeof window !== "undefined" && !checkAuth()) {
    navigate({ to: "/" });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const totalLimit = mockCards.reduce((s, c) => s + c.limit, 0);
  const totalUsed = mockCards.reduce((s, c) => s + c.used, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">CardVault</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-2xl font-bold text-foreground">Your Cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Total spend: ${totalUsed.toLocaleString("en-US", { minimumFractionDigits: 2 })} of ${totalLimit.toLocaleString("en-US")} limit
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                to="/card/$cardId"
                params={{ cardId: card.id }}
                className="group block"
              >
                {/* Card visual */}
                <div className={`${card.gradient} relative aspect-[1.6/1] overflow-hidden rounded-2xl p-5 transition-transform group-hover:scale-[1.02]`}>
                  <div className="absolute right-4 top-4 opacity-30">
                    <Wifi className="h-6 w-6 text-white rotate-90" />
                  </div>
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-white/70">
                        {card.brand}
                      </p>
                      <p className="font-display text-lg font-bold text-white">
                        {card.name}
                      </p>
                    </div>
                    <div>
                      <p className="font-mono text-lg tracking-[0.2em] text-white/90">
                        •••• •••• •••• {card.lastFour}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card info */}
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      ${card.used.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of ${card.limit.toLocaleString("en-US")} limit
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>

                {/* Usage bar */}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min((card.used / card.limit) * 100, 100)}%` }}
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
