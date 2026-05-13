import { useEffect, useReducer } from "react";
import { mockCards } from "./mock-data";

// ── Module-level reactive store ──────────────────────────────────────────────

const blockedCards = new Set<string>();
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l());
}

export function blockCard(cardId: string) {
  blockedCards.add(cardId);
  notify();
}

export function unblockCard(cardId: string) {
  blockedCards.delete(cardId);
  notify();
}

export function blockAllCards() {
  mockCards.forEach((c) => blockedCards.add(c.id));
  notify();
}

export function isCardBlocked(cardId: string): boolean {
  return blockedCards.has(cardId);
}

export function getBlockedCardIds(): string[] {
  return Array.from(blockedCards);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ── React hook ───────────────────────────────────────────────────────────────

/** Re-renders the component whenever the blocked-cards state changes. */
export function useBlockedCards() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  useEffect(() => subscribe(forceUpdate), []);
  return {
    isBlocked: (cardId: string) => blockedCards.has(cardId),
    blockedIds: Array.from(blockedCards),
  };
}
