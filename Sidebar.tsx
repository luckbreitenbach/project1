"use client";

import React from "react";
import { pokerSounds } from "@/lib/sound-effects";

export type NavTab = "table" | "ranges" | "opponents" | "scenarios" | "pot-odds";

interface SidebarProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onChangeTab }) => {
  const navItems: Array<{ id: NavTab; label: string; icon: string; badge?: string; desc: string }> = [
    {
      id: "table",
      label: "Live Table Simulator",
      icon: "♠",
      badge: "LIVE",
      desc: "Visual felt, board & Monte Carlo",
    },
    {
      id: "ranges",
      label: "13x13 Range Matrix",
      icon: "📊",
      desc: "Combos, weights & GTO grids",
    },
    {
      id: "opponents",
      label: "Opponent Profiler & HUD",
      icon: "👤",
      desc: "VPIP, PFR & exploit gameplans",
    },
    {
      id: "scenarios",
      label: "Hand Scenario Lab",
      icon: "💾",
      desc: "Replay past hands & what-if",
    },
    {
      id: "pot-odds",
      label: "Pot Odds & GTO Math",
      icon: "🧮",
      desc: "Rule of 2/4, MDF & SPR",
    },
  ];

  const handleSelect = (id: NavTab) => {
    pokerSounds.playChipBet();
    onChangeTab(id);
  };

  return (
    <aside className="w-full md:w-64 bg-slate-950/80 border-r border-amber-500/20 p-3 sm:p-4 flex flex-row md:flex-col justify-between shrink-0 gap-2">
      <div className="flex flex-row md:flex-col gap-1.5 w-full overflow-x-auto pb-1 md:pb-0">
        <div className="hidden md:block px-3 py-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all text-left cursor-pointer whitespace-nowrap md:whitespace-normal ${
                isActive
                  ? "bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-transparent border border-amber-500/50 text-slate-100 shadow-md"
                  : "bg-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-base sm:text-lg ${
                    isActive ? "text-amber-400 font-bold" : "text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>
                <div>
                  <div
                    className={`text-xs font-bold ${
                      isActive ? "text-amber-300" : "text-slate-300"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-500 hidden md:block">{item.desc}</div>
                </div>
              </div>

              {item.badge && (
                <span className="hidden sm:inline-block text-[9px] px-1.5 py-0.5 rounded bg-emerald-900 text-emerald-300 font-mono font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Pro Tip Box */}
      <div className="hidden md:block p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <span className="font-bold text-amber-400 flex items-center gap-1">
          <span>💡</span> GTO Pro Tip
        </span>
        <p className="leading-snug text-slate-400">
          When drawing with 9 outs (Flush Draw) on the flop, you have approx. <strong className="text-emerald-300">36% equity</strong> by the river.
        </p>
      </div>
    </aside>
  );
};
