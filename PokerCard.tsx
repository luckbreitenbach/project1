"use client";

import React from "react";
import { Card, parseCard, SUIT_SYMBOLS } from "@/lib/poker-engine";

interface PokerCardProps {
  card?: Card | string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  onClear?: (e: React.MouseEvent) => void;
  highlight?: boolean;
  emptyLabel?: string;
  className?: string;
}

export const PokerCard: React.FC<PokerCardProps> = ({
  card,
  size = "md",
  onClick,
  onClear,
  highlight = false,
  emptyLabel = "Add",
  className = "",
}) => {
  const parsedCard: Card | null = typeof card === "string" ? parseCard(card) : (card || null);

  const sizeClasses = {
    sm: "w-10 h-14 text-xs rounded-md",
    md: "w-14 h-20 text-sm rounded-lg",
    lg: "w-18 h-26 text-base rounded-xl",
  }[size];

  if (!parsedCard) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center border-2 border-dashed border-emerald-700/60 bg-emerald-950/40 hover:border-amber-400/80 hover:bg-emerald-900/40 transition-all duration-200 cursor-pointer shadow-inner ${sizeClasses} ${className}`}
      >
        <span className="text-emerald-500/70 group-hover:text-amber-300 font-bold transition-colors">
          +
        </span>
        <span className="text-[10px] uppercase tracking-wider text-emerald-400/60 group-hover:text-amber-200/90 font-medium">
          {emptyLabel}
        </span>
      </button>
    );
  }

  const suitInfo = SUIT_SYMBOLS[parsedCard.suit];
  const isRed = parsedCard.suit === 'h' || parsedCard.suit === 'd';

  return (
    <div
      onClick={onClick}
      className={`relative select-none flex flex-col justify-between p-1.5 bg-gradient-to-b from-slate-50 via-white to-slate-100 border text-slate-900 shadow-md transition-all transform hover:-translate-y-1 cursor-pointer font-bold ${
        highlight
          ? "border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_15px_rgba(251,191,36,0.5)]"
          : "border-slate-300 hover:border-amber-400"
      } ${sizeClasses} ${className}`}
    >
      {/* Top rank & suit */}
      <div className="flex items-center justify-between leading-none">
        <span className={isRed ? "text-rose-600 font-extrabold" : "text-slate-900 font-extrabold"}>
          {parsedCard.rank}
        </span>
        <span className={`text-[11px] ${isRed ? "text-rose-600" : "text-slate-900"}`}>
          {suitInfo.symbol}
        </span>
      </div>

      {/* Center big suit symbol */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-90">
        <span
          className={`text-2xl sm:text-3xl ${
            parsedCard.suit === 'h'
              ? 'text-rose-600'
              : parsedCard.suit === 'd'
              ? 'text-amber-600'
              : parsedCard.suit === 'c'
              ? 'text-emerald-700'
              : 'text-slate-900'
          }`}
        >
          {suitInfo.symbol}
        </span>
      </div>

      {/* Bottom inverted rank & suit */}
      <div className="flex items-center justify-between leading-none rotate-180">
        <span className={isRed ? "text-rose-600 font-extrabold" : "text-slate-900 font-extrabold"}>
          {parsedCard.rank}
        </span>
        <span className={`text-[11px] ${isRed ? "text-rose-600" : "text-slate-900"}`}>
          {suitInfo.symbol}
        </span>
      </div>

      {/* Optional hover clear button */}
      {onClear && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear(e);
          }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] hover:bg-rose-700 shadow"
          title="Remove card"
        >
          ×
        </button>
      )}
    </div>
  );
};
