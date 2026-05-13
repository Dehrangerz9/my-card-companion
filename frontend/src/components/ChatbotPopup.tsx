import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, ShieldAlert, Navigation, LogOut, Lock } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { blockCard, blockAllCards } from "../lib/card-store";
import { logout } from "../lib/auth-store";
import { mockCards } from "../lib/mock-data";

// ── Types ────────────────────────────────────────────────────────────────────

type ActionType =
  | "block_all_cards"
  | "block_card"
  | "show_block_options"
  | "navigate_dashboard"
  | "navigate_card"
  | "logout"
  | null;

interface PendingAction {
  type: ActionType;
  data: Record<string, string>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  /** If set, this message is waiting for user confirmation before executing. */
  pendingAction?: PendingAction;
  /** True once the action was confirmed or cancelled. */
  actionResolved?: boolean;
}

// ── API ──────────────────────────────────────────────────────────────────────

const API_URL = "http://localhost:8000";

async function fetchBotResponse(message: string): Promise<{
  response: string;
  action: ActionType;
  action_data: Record<string, string>;
}> {
  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    return {
      response:
        "Não consegui me conectar ao servidor. Verifique se o backend está rodando em **localhost:8000**.",
      action: null,
      action_data: {},
    };
  }
}

// ── Action helpers ────────────────────────────────────────────────────────────

function getActionIcon(type: ActionType) {
  if (type === "block_all_cards" || type === "block_card") return ShieldAlert;
  if (type === "navigate_dashboard" || type === "navigate_card") return Navigation;
  if (type === "logout") return LogOut;
  return Lock;
}

function getActionConfirmLabel(action: PendingAction): string {
  if (action.type === "block_all_cards") return "Bloquear todos os cartões";
  if (action.type === "block_card")
    return `Bloquear ${action.data.cardName} (final ${action.data.lastFour})`;
  if (action.type === "navigate_dashboard") return "Ir ao painel";
  if (action.type === "navigate_card") return `Ir para ${action.data.cardName}`;
  if (action.type === "logout") return "Sair da conta";
  return "Confirmar";
}

// ── Quick replies ─────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Qual meu saldo?",
  "O que você faz?",
  "Fui roubado",
  "Bloquear cartão",
];

// ── Component ─────────────────────────────────────────────────────────────────

export function ChatbotPopup() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        'Olá! Sou o assistente do CardVault. Como posso te ajudar hoje?\n\nDica: pergunte **"o que você faz"** para ver tudo que posso fazer.',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Execute a confirmed action ───────────────────────────────────────────

  const executeAction = (action: PendingAction) => {
    switch (action.type) {
      case "block_all_cards": {
        blockAllCards();
        appendBotMessage(
          "Todos os seus cartões foram **bloqueados** com sucesso. Entre em contato com o banco para mais informações.",
        );
        break;
      }
      case "block_card": {
        blockCard(action.data.cardId);
        appendBotMessage(
          `O cartão **${action.data.cardName}** (final ${action.data.lastFour}) foi **bloqueado** com sucesso.`,
        );
        break;
      }
      case "navigate_dashboard": {
        navigate({ to: "/dashboard" });
        setIsOpen(false);
        break;
      }
      case "navigate_card": {
        navigate({ to: "/card/$cardId", params: { cardId: action.data.cardId } });
        setIsOpen(false);
        break;
      }
      case "logout": {
        logout();
        navigate({ to: "/" });
        setIsOpen(false);
        break;
      }
    }
  };

  const appendBotMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content,
        timestamp: new Date(),
        actionResolved: true,
      },
    ]);
  };

  // ── Confirm / cancel ─────────────────────────────────────────────────────

  const handleConfirm = (msgId: string, action: PendingAction) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionResolved: true } : m)),
    );
    executeAction(action);
  };

  const handleCancel = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionResolved: true } : m)),
    );
    appendBotMessage("Tudo bem! Operação cancelada. Posso ajudar com mais alguma coisa?");
  };

  // ── Block card from the inline picker ────────────────────────────────────

  const handleBlockOption = (
    msgId: string,
    cardId: string,
    cardName: string,
    lastFour: string,
  ) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, actionResolved: true } : m)),
    );
    const confirmMsgId = `bot-confirm-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: confirmMsgId,
        role: "assistant",
        content: `Deseja bloquear o cartão **${cardName}** (final ${lastFour})?`,
        timestamp: new Date(),
        pendingAction: { type: "block_card", data: { cardId, cardName, lastFour } },
        actionResolved: false,
      },
    ]);
  };

  // ── Send message ─────────────────────────────────────────────────────────

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const { response, action, action_data } = await fetchBotResponse(text.trim());
    setIsTyping(false);

    const botMsgId = `bot-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      {
        id: botMsgId,
        role: "assistant",
        content: response,
        timestamp: new Date(),
        pendingAction: action ? { type: action, data: action_data } : undefined,
        actionResolved: action ? false : true,
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-16 right-0 mb-2 flex h-[520px] w-[370px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">
                    Assistente CardVault
                  </p>
                  <p className="text-[10px] text-primary-foreground/70">Sempre aqui para ajudar</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      msg.role === "assistant"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="h-3.5 w-3.5" />
                    ) : (
                      <User className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div className="flex flex-col gap-2 max-w-[80%]">
                    {/* Bubble */}
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        msg.role === "assistant"
                          ? "rounded-tl-sm bg-muted text-foreground"
                          : "rounded-tr-sm bg-primary text-primary-foreground"
                      }`}
                    >
                      <SimpleMarkdown content={msg.content} />
                    </div>

                    {/* Inline card block picker */}
                    {msg.pendingAction?.type === "show_block_options" &&
                      !msg.actionResolved && (
                        <div className="flex flex-col gap-1.5">
                          {mockCards.map((card) => (
                            <button
                              key={card.id}
                              onClick={() =>
                                handleBlockOption(
                                  msg.id,
                                  card.id,
                                  card.name,
                                  card.lastFour,
                                )
                              }
                              className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                              <Lock className="h-3 w-3" />
                              {card.name} •••• {card.lastFour}
                            </button>
                          ))}
                          <button
                            onClick={() => handleCancel(msg.id)}
                            className="rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}

                    {/* Confirmation for all other actions */}
                    {msg.pendingAction &&
                      msg.pendingAction.type !== "show_block_options" &&
                      !msg.actionResolved && (
                        <ActionConfirmation
                          action={msg.pendingAction}
                          onConfirm={() => handleConfirm(msg.id, msg.pendingAction!)}
                          onCancel={() => handleCancel(msg.id)}
                        />
                      )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => sendMessage(reply)}
                    className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite uma mensagem…"
                  className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg glow-primary transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// ── Action confirmation card ──────────────────────────────────────────────────

function ActionConfirmation({
  action,
  onConfirm,
  onCancel,
}: {
  action: PendingAction;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const Icon = getActionIcon(action.type);
  const isDestructive =
    action.type === "block_all_cards" ||
    action.type === "block_card" ||
    action.type === "logout";

  return (
    <div
      className={`rounded-xl border p-3 ${
        isDestructive
          ? "border-destructive/30 bg-destructive/5"
          : "border-primary/20 bg-primary/5"
      }`}
    >
      <div className="flex items-center gap-2 mb-2.5">
        <Icon
          className={`h-3.5 w-3.5 ${isDestructive ? "text-destructive" : "text-primary"}`}
        />
        <span
          className={`text-xs font-semibold ${isDestructive ? "text-destructive" : "text-primary"}`}
        >
          {getActionConfirmLabel(action)}
        </span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold text-white transition-colors ${
            isDestructive
              ? "bg-destructive hover:bg-destructive/90"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          Confirmar
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ── Simple markdown renderer ──────────────────────────────────────────────────

function SimpleMarkdown({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part === "\n") return <br key={i} />;
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
