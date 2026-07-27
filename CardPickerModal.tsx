"use client";

import React, { useState } from "react";
import { RANKS, SUITS, SUIT_SYMBOLS, Suit, Card } from "@/lib/poker-engine";
import { pokerSounds } from "@/lib/sound-effects";

interface CardPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCard: (cardCode: string) => void;
  usedCardCodes: Set<string>;
  title?: string;
}

export const CardPickerModal: React.FC<CardPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCard,
  usedCardCodes,
  title = "Select Playing Card",
}) => {
  const [selectedSuitFilter, setSelectedSuitFilter] = useState<Suit | "all">("all");

  if (!isOpen) return null;

  const suitsToDisplay: Suit[] = selectedSuitFilter === "all" ? SUITS : [selectedSuitFilter];

  const handlePick = (code: string) => {
    pokerSounds.playCardDeal();
    onSelectCard(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🂠</span>
            <h3 className="text-lg font-bold text-amber-400">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Suit Tabs Filter */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedSuitFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedSuitFilter === "all"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All Suits (52)
          </button>
          {SUITS.map((suit) => {
            const info = SUIT_SYMBOLS[suit];
            const active = selectedSuitFilter === suit;
            return (
              <button
                key={suit}
                type="button"
                onClick={() => setSelectedSuitFilter(suit)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className={`text-base leading-none ${active ? 'text-slate-950' : info.color}`}>
                  {info.symbol}
                </span>
                <span>{info.label}</span>
              </button>
            );
          })}
        </div>

        {/* 52 Cards Grid */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {suitsToDisplay.map((suit) => {
            const suitInfo = SUIT_SYMBOLS[suit];
            const isRed = suit === "h" || suit === "d";

            return (
              <div key={suit} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-lg ${suitInfo.color}`}>{suitInfo.symbol}</span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {suitInfo.label}
                  </span>
                </div>
                <div className="grid grid-cols-7 sm:grid-cols-13 gap-1.5">
                  {RANKS.map((rank) => {
                    const code = `${rank}${suit}`;
                    const isUsed = usedCardCodes.has(code);

                    return (
                      <button
                        key={code}
                        type="button"
                        disabled={isUsed}
                        onClick={() => handlePick(code)}
                        className={`relative flex flex-col items-center justify-between p-1.5 h-14 rounded-lg font-bold transition-all ${
                          isUsed
                            ? "bg-slate-800/40 border border-slate-800 text-slate-600 opacity-40 cursor-not-allowed"
                            : "bg-gradient-to-b from-white to-slate-100 border border-slate-300 text-slate-900 hover:border-amber-400 hover:scale-105 hover:shadow-lg cursor-pointer"
                        }`}
                      >
                        <span className={`text-xs ${isUsed ? 'text-slate-600' : isRed ? 'text-rose-600' : 'text-slate-950'}`}>
                          {rank}
                        </span>
                        <span className={`text-sm ${isUsed ? 'text-slate-600' : isRed ? 'text-rose-600' : 'text-slate-950'}`}>
                          {suitInfo.symbol}
                        </span>
                        {isUsed && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-slate-400 bg-slate-950/70 rounded-lg">
                            DEALT
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{usedCardCodes.size} / 52 cards currently dealt in table scenario</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
