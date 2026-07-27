"use client";

import React, { useState } from "react";
import { pokerSounds } from "@/lib/sound-effects";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    email: string;
    role: string;
    bankroll: number;
    preferredTheme: string;
    preferredSimRuns: number;
    soundEffects: boolean;
  };
  onUpdateUser: (updated: Record<string, unknown>) => void;
  onQuickPersonaSwitch: (persona: "kidpoker" | "valkyrie" | "sammy") => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onQuickPersonaSwitch,
}) => {
  const [name, setName] = useState(user.name);
  const [bankroll, setBankroll] = useState(user.bankroll);
  const [simRuns, setSimRuns] = useState(user.preferredSimRuns);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    pokerSounds.playWinFanfare();
    const updated = {
      name,
      bankroll: Number(bankroll),
      preferredSimRuns: Number(simRuns),
    };
    onUpdateUser(updated);
    try {
      await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch {
      // Fallback
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-amber-400">Player Profile & Table Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Persona quick switch */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 block">
            Quick Persona Switch
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onQuickPersonaSwitch("kidpoker");
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400 text-left text-xs space-y-1"
            >
              <div className="font-bold text-amber-300 truncate">Daniel &apos;KidPoker&apos;</div>
              <div className="text-[10px] text-slate-400">$85,000 Pro</div>
            </button>
            <button
              type="button"
              onClick={() => {
                onQuickPersonaSwitch("valkyrie");
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-400 text-left text-xs space-y-1"
            >
              <div className="font-bold text-cyan-300 truncate">Victoria Valkyrie</div>
              <div className="text-[10px] text-slate-400">$145,000 GTO</div>
            </button>
            <button
              type="button"
              onClick={() => {
                onQuickPersonaSwitch("sammy");
                onClose();
              }}
              className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-rose-400 text-left text-xs space-y-1"
            >
              <div className="font-bold text-rose-300 truncate">Sammy The Rock</div>
              <div className="text-[10px] text-slate-400">$42,000 Vegas</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Bankroll ($)</label>
              <input
                type="number"
                value={bankroll}
                onChange={(e) => setBankroll(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Default Monte Carlo Runs
            </label>
            <select
              value={simRuns}
              onChange={(e) => setSimRuns(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300"
            >
              <option value={1000}>1,000 Runs (Instant response)</option>
              <option value={5000}>5,000 Runs (Balanced precision)</option>
              <option value={10000}>10,000 Runs (High precision)</option>
              <option value={25000}>25,000 Runs (Casino high roller)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
