"use client";

import React from "react";
import { pokerSounds } from "@/lib/sound-effects";

interface HeaderProps {
  user: {
    name: string;
    role: string;
    bankroll: number;
    avatar?: string;
  };
  currentTheme: string;
  onChangeTheme: (theme: string) => void;
  onQuickPersonaSwitch: (persona: "kidpoker" | "valkyrie" | "sammy") => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentTheme,
  onChangeTheme,
  onQuickPersonaSwitch,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-amber-500/20 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-500 flex items-center justify-center font-black text-slate-950 text-xl shadow-lg shadow-amber-500/20">
          ♠
        </div>
        <div>
          <h1 className="text-base font-black tracking-wider text-slate-100 flex items-center gap-1.5">
            <span className="text-amber-400">ROYAL FELT</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-500/30">
              GTO & Monte Carlo
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Texas Hold&apos;em Opponent Hand &amp; Probability Engine
          </p>
        </div>
      </div>

      {/* Action Controls & User Profile */}
      <div className="flex items-center gap-3">
        {/* Felt Theme Selector */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onChangeTheme("emerald")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              currentTheme === "emerald"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Emerald
          </button>
          <button
            type="button"
            onClick={() => onChangeTheme("midnight")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              currentTheme === "midnight"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Midnight
          </button>
          <button
            type="button"
            onClick={() => onChangeTheme("ruby")}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
              currentTheme === "ruby"
                ? "bg-rose-700 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ruby
          </button>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => {
            pokerSounds.enabled = !soundEnabled;
            onToggleSound();
            if (!soundEnabled) pokerSounds.playChipBet();
          }}
          className={`p-2 rounded-xl border transition-all text-xs font-semibold flex items-center gap-1 ${
            soundEnabled
              ? "bg-slate-900 border-amber-500/40 text-amber-300"
              : "bg-slate-900/50 border-slate-800 text-slate-500"
          }`}
          title={soundEnabled ? "Mute audio sound effects" : "Unmute audio sound effects"}
        >
          <span>{soundEnabled ? "🔊" : "🔇"}</span>
        </button>

        {/* Bankroll Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
          <span className="text-emerald-400 text-xs">💰</span>
          <div className="flex flex-col text-right leading-none">
            <span className="text-[9px] uppercase font-bold text-slate-400">Bankroll</span>
            <span className="text-xs font-black text-emerald-300 font-mono">
              ${user.bankroll.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Persona Switcher Dropdown */}
        <div className="relative group">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 p-1.5 pr-3 rounded-xl transition-all cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                {user.name}
              </div>
              <div className="text-[10px] text-amber-400 font-medium">{user.role}</div>
            </div>
            <span className="text-slate-400 text-xs">⚙</span>
          </button>
        </div>
      </div>
    </header>
  );
};
