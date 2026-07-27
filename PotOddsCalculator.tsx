"use client";

import React, { useState } from "react";
import { pokerSounds } from "@/lib/sound-effects";

export const PotOddsCalculator: React.FC = () => {
  // Pot odds state
  const [potSize, setPotSize] = useState<number>(300);
  const [betSize, setBetSize] = useState<number>(100);

  // Outs state
  const [outsCount, setOutsCount] = useState<number>(9); // 9 outs for flush draw

  // SPR state
  const [effectiveStack, setEffectiveStack] = useState<number>(1500);
  const [flopPot, setFlopPot] = useState<number>(200);

  // Calculations
  const totalPot = potSize + betSize;
  const potOddsPct = betSize > 0 ? (betSize / (totalPot + betSize)) * 100 : 0;
  const mdfPct = potSize + betSize > 0 ? (potSize / (potSize + betSize)) * 100 : 0;
  const breakEvenBluffPct = betSize + potSize > 0 ? (betSize / (betSize + potSize)) * 100 : 0;

  // Outs to equity rule of 2 & 4
  const turnRiverEquity = Math.min(100, outsCount * 4);
  const riverOnlyEquity = Math.min(100, outsCount * 2);

  // SPR
  const spr = flopPot > 0 ? Number((effectiveStack / flopPot).toFixed(1)) : 0;

  const handleOutPreset = (outs: number) => {
    pokerSounds.playChipBet();
    setOutsCount(outs);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>🧮</span> Pot Odds, MDF & SPR Strategy Suite
          </h2>
          <p className="text-xs text-slate-400">
            Instant live-action poker math: Rule of 2/4 Outs, Minimum Defense Frequency, and SPR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. POT ODDS & MDF CALCULATOR */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <h3 className="text-sm font-bold text-amber-400">Pot Odds & MDF</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Current Pot ($)</label>
              <input
                type="number"
                value={potSize}
                onChange={(e) => setPotSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Opponent Bet to Call ($)</label>
              <input
                type="number"
                value={betSize}
                onChange={(e) => setBetSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Pot Odds:</span>
              <span className="text-amber-300 font-bold font-mono text-sm">
                {potOddsPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Min Defense Freq (MDF):</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">
                {mdfPct.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Break-Even Bluff:</span>
              <span className="text-sky-400 font-bold font-mono text-sm">
                {breakEvenBluffPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* 2. RULE OF 2 & 4 OUTS ENGINE */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🎯</span>
            <h3 className="text-sm font-bold text-amber-400">Rule of 2 & 4 Outs Engine</h3>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <span className="text-slate-400 font-semibold">Number of Clean Outs</span>
              <span className="text-amber-400 font-mono font-bold">{outsCount} Outs</span>
            </div>
            <input
              type="range"
              min={1}
              max={21}
              value={outsCount}
              onChange={(e) => setOutsCount(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <button
              type="button"
              onClick={() => handleOutPreset(9)}
              className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              Flush Draw (9)
            </button>
            <button
              type="button"
              onClick={() => handleOutPreset(8)}
              className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              Open Straight (8)
            </button>
            <button
              type="button"
              onClick={() => handleOutPreset(4)}
              className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              Gutshot (4)
            </button>
            <button
              type="button"
              onClick={() => handleOutPreset(15)}
              className="py-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800"
            >
              Combo Draw (15)
            </button>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Flop to River (~4x):</span>
              <span className="text-emerald-300 font-bold font-mono text-sm">
                ~{turnRiverEquity}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Turn to River (~2x):</span>
              <span className="text-amber-300 font-bold font-mono text-sm">
                ~{riverOnlyEquity}%
              </span>
            </div>
          </div>
        </div>

        {/* 3. STACK-TO-POT RATIO (SPR) */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-base">🏰</span>
            <h3 className="text-sm font-bold text-amber-400">Stack-to-Pot Ratio (SPR)</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Effective Stack ($)</label>
              <input
                type="number"
                value={effectiveStack}
                onChange={(e) => setEffectiveStack(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold mb-1">Pot on the Flop ($)</label>
              <input
                type="number"
                value={flopPot}
                onChange={(e) => setFlopPot(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono font-bold"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-semibold">Calculated SPR:</span>
              <span className="text-amber-400 font-black font-mono text-base">{spr}</span>
            </div>
            <p className="text-[11px] text-emerald-300 pt-1">
              {spr <= 3
                ? "Low SPR (<3): High commitment. Auto-shove top pair or strong draws."
                : spr <= 6
                ? "Medium SPR (3-6): Standard post-flop play. Protect against sets."
                : "Deep SPR (>6): Position and implied odds are king. Exercise pot control."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
