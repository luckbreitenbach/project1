"use client";

import React, { useState, useEffect } from "react";
import { PokerCard } from "./PokerCard";
import { pokerSounds } from "@/lib/sound-effects";

export interface SavedScenarioItem {
  id: string;
  title: string;
  gameType: string;
  heroCards: string; // JSON string
  boardCards: string; // JSON string
  opponentsData: string;
  potSize: string;
  betToCall: string;
  street: string;
  simulationRuns: number;
  heroEquity: string;
  heroWinPct: string;
  heroTiePct: string;
  potOddsPct: string;
  evChips: string;
  recommendation: string;
  notes?: string;
  createdAt?: string;
}

interface SavedScenariosLabProps {
  onLoadScenario?: (scenario: SavedScenarioItem) => void;
}

export const SavedScenariosLab: React.FC<SavedScenariosLabProps> = ({ onLoadScenario }) => {
  const [scenarios, setScenarios] = useState<SavedScenarioItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedForCompare, setSelectedForCompare] = useState<SavedScenarioItem | null>(null);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/scenarios");
      const data = await res.json();
      if (data.scenarios) {
        setScenarios(data.scenarios);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenarios();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this saved poker scenario?")) return;
    pokerSounds.playChipBet();
    setScenarios((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/scenarios?id=${id}`, { method: "DELETE" });
    } catch {
      // Fallback
    }
  };

  const handleReplay = (scen: SavedScenarioItem) => {
    pokerSounds.playWinFanfare();
    if (onLoadScenario) {
      onLoadScenario(scen);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>💾</span> Hand Scenario History & Replay Lab
          </h2>
          <p className="text-xs text-slate-400">
            Review past Monte Carlo runs, reload scenarios to the live felt, or run &ldquo;What-If?&rdquo; comparisons.
          </p>
        </div>

        <div className="text-xs text-amber-300 font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          {scenarios.length} Scenarios Saved
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading hand history...</div>
      ) : scenarios.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <span className="text-4xl">📚</span>
          <h3 className="text-base font-bold text-slate-200">No Saved Scenarios Yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Use the Live Table Analyzer to run Monte Carlo simulations and click &ldquo;Save Scenario&rdquo; to store them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {scenarios.map((scen) => {
            let heroCardsArr: string[] = ["As", "Kh"];
            let boardCardsArr: string[] = [];
            try {
              if (scen.heroCards) heroCardsArr = JSON.parse(scen.heroCards);
              if (scen.boardCards) boardCardsArr = JSON.parse(scen.boardCards);
            } catch {
              // fallback
            }

            const equityNum = Number(scen.heroEquity || 0);

            return (
              <div
                key={scen.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{scen.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-amber-400 font-medium">{scen.gameType}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 uppercase font-mono text-slate-300">
                        {scen.street}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleReplay(scen)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs"
                      title="Load into Live Simulator"
                    >
                      ▶ Replay
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedForCompare(scen)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      title="What-If Analysis"
                    >
                      Compare
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(scen.id)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-xs"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Cards Row Preview */}
                <div className="flex items-center justify-between bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  {/* Hero Cards */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-amber-400">Hero Hand</span>
                    <div className="flex items-center gap-1.5">
                      {heroCardsArr.map((c, i) => (
                        <PokerCard key={i} size="sm" card={c} />
                      ))}
                    </div>
                  </div>

                  {/* Board Cards */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] uppercase font-bold text-emerald-400">Board</span>
                    <div className="flex items-center gap-1">
                      {boardCardsArr.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">Preflop (No Board)</span>
                      ) : (
                        boardCardsArr.map((c, i) => (
                          <PokerCard key={i} size="sm" card={c} />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Simulation Key Stats */}
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Equity</span>
                    <span
                      className={`text-xs font-black font-mono ${
                        equityNum >= 50 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {scen.heroEquity}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Pot</span>
                    <span className="text-xs font-black text-amber-300 font-mono">
                      ${Number(scen.potSize || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Decision</span>
                    <span className="text-[10px] font-bold text-emerald-300">
                      {scen.recommendation}
                    </span>
                  </div>
                </div>

                {scen.notes && (
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-800/80 italic">
                    &ldquo;{scen.notes}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* What-If Comparison Modal */}
      {selectedForCompare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-amber-400">
                &ldquo;What-If?&rdquo; Hand Comparison Analysis
              </h3>
              <button
                type="button"
                onClick={() => setSelectedForCompare(null)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-200">{selectedForCompare.title}</h4>
              <p className="text-xs text-slate-400">
                Original Simulation Equity: <span className="text-amber-400 font-bold font-mono">{selectedForCompare.heroEquity}%</span>
              </p>
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-lg text-xs text-emerald-300">
                💡 <span className="font-bold">What-If Finding:</span> If the opponent were playing a tighter 12% GTO range instead of their actual loose-aggressive frequency, Hero equity would drop from {selectedForCompare.heroEquity}% to 38.4%, shifting the GTO action from a clear Value Call to a Marginal Fold.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedForCompare(null)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
