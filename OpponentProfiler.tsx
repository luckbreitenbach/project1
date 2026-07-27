"use client";

import React, { useState, useEffect } from "react";
import { pokerSounds } from "@/lib/sound-effects";

export interface OpponentProfile {
  id: string;
  name: string;
  avatar?: string;
  archetype: string;
  vpip: string;
  pfr: string;
  threeBet: string;
  aggressionFactor: string;
  foldToCbet: string;
  wtsd: string;
  notes?: string;
  exploits?: string;
  colorTag?: string;
  handsTracked?: number;
}

export const OpponentProfiler: React.FC = () => {
  const [opponents, setOpponents] = useState<OpponentProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedArchetype, setSelectedArchetype] = useState<string>("all");

  // Modal State for Add / Edit Opponent
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingOpp, setEditingOpp] = useState<OpponentProfile | null>(null);

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    archetype: "TAG",
    vpip: "24.0",
    pfr: "18.5",
    threeBet: "7.8",
    aggressionFactor: "2.8",
    foldToCbet: "45.0",
    wtsd: "26.0",
    notes: "",
  });

  const fetchOpponents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/opponents");
      const data = await res.json();
      if (data.opponents) {
        setOpponents(data.opponents);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpponents();
  }, []);

  const openAddModal = () => {
    setEditingOpp(null);
    setFormData({
      name: "",
      archetype: "TAG",
      vpip: "24.0",
      pfr: "18.5",
      threeBet: "7.8",
      aggressionFactor: "2.8",
      foldToCbet: "45.0",
      wtsd: "26.0",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (opp: OpponentProfile) => {
    setEditingOpp(opp);
    setFormData({
      name: opp.name,
      archetype: opp.archetype,
      vpip: opp.vpip,
      pfr: opp.pfr,
      threeBet: opp.threeBet,
      aggressionFactor: opp.aggressionFactor,
      foldToCbet: opp.foldToCbet,
      wtsd: opp.wtsd,
      notes: opp.notes || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this opponent profile?")) return;
    pokerSounds.playChipBet();
    setOpponents((prev) => prev.filter((o) => o.id !== id));
    try {
      await fetch(`/api/opponents?id=${id}`, { method: "DELETE" });
    } catch {
      // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    pokerSounds.playWinFanfare();

    const payload = {
      ...formData,
      id: editingOpp ? editingOpp.id : `opp-${Date.now()}`,
      exploits: generateDynamicExploits(formData),
    };

    if (editingOpp) {
      setOpponents((prev) =>
        prev.map((o) => (o.id === editingOpp.id ? { ...o, ...payload } : o))
      );
      try {
        await fetch("/api/opponents", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback
      }
    } else {
      setOpponents((prev) => [payload as OpponentProfile, ...prev]);
      try {
        await fetch("/api/opponents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback
      }
    }

    setModalOpen(false);
  };

  const generateDynamicExploits = (data: {
    vpip: string;
    pfr: string;
    foldToCbet: string;
    aggressionFactor: string;
  }) => {
    const vpipNum = Number(data.vpip);
    const pfrNum = Number(data.pfr);
    const foldNum = Number(data.foldToCbet);
    const afNum = Number(data.aggressionFactor);

    const tips: string[] = [];
    if (vpipNum > 35 && pfrNum < 15) {
      tips.push("Loose-Passive Fish: Never bluff; value bet 3 streets with top pair or better.");
    }
    if (foldNum > 55) {
      tips.push("Over-folds to Flop C-Bets: Bet 100% of dry flops for minimum sizing.");
    }
    if (afNum > 3.5) {
      tips.push("Hyper Aggressive: Induce bluffs by checking strong showdown hands on the turn.");
    }
    if (vpipNum < 15) {
      tips.push("Tight Nit: Steal blinds relentlessly; fold whenever he raises turn or river.");
    }
    if (tips.length === 0) {
      tips.push("Standard GTO baseline opponent: Play balanced frequencies and protect check ranges.");
    }
    return JSON.stringify(tips);
  };

  const filtered = opponents.filter((opp) => {
    const matchSearch = opp.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchArchetype =
      selectedArchetype === "all" || opp.archetype.toLowerCase() === selectedArchetype.toLowerCase();
    return matchSearch && matchArchetype;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>👤</span> Opponent Tendency Profiler & HUD
          </h2>
          <p className="text-xs text-slate-400">
            Track VPIP, PFR, Aggression Factor, and auto-generate AI exploitative gameplans.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-100 rounded-xl px-3 py-1.5 text-xs focus:border-amber-400"
          />
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
          >
            + Add Opponent Profile
          </button>
        </div>
      </div>

      {/* Archetype Quick Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["all", "TAG", "LAG", "Maniac", "Nit", "GTO Wizard", "Fish"].map((arch) => (
          <button
            key={arch}
            type="button"
            onClick={() => setSelectedArchetype(arch)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all ${
              selectedArchetype === arch
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800"
            }`}
          >
            {arch === "all" ? "All Archetypes" : arch}
          </button>
        ))}
      </div>

      {/* Opponents Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading opponent database...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <span className="text-4xl">🃏</span>
          <h3 className="text-base font-bold text-slate-200">No Opponent Profiles Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add an opponent profile to track their HUD tendencies and generate counter-strategies.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            + Add First Opponent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((opp) => {
            let exploitsArr: string[] = [];
            try {
              if (opp.exploits) exploitsArr = JSON.parse(opp.exploits);
            } catch {
              // fallback
            }

            return (
              <div
                key={opp.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-5 shadow-xl transition-all space-y-4"
              >
                {/* Header info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center font-bold text-slate-950 text-base shadow-md">
                      {opp.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">{opp.name}</h3>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase border border-amber-500/30">
                        {opp.archetype}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(opp)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                      title="Edit Profile"
                    >
                      ✎ Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(opp.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-xs font-semibold"
                      title="Delete Profile"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {/* HUD STAT GAUGE MATRIX */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-center">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">VPIP</span>
                    <span className="text-xs font-black text-amber-400 font-mono">{opp.vpip}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">PFR</span>
                    <span className="text-xs font-black text-emerald-400 font-mono">{opp.pfr}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">3-BET</span>
                    <span className="text-xs font-black text-sky-400 font-mono">{opp.threeBet}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">AF</span>
                    <span className="text-xs font-black text-rose-400 font-mono">{opp.aggressionFactor}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">FOLD C-BET</span>
                    <span className="text-xs font-black text-purple-400 font-mono">{opp.foldToCbet}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">WTSD</span>
                    <span className="text-xs font-black text-amber-300 font-mono">{opp.wtsd}%</span>
                  </div>
                </div>

                {/* Notes & Exploits box */}
                {opp.notes && (
                  <p className="text-xs text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 italic">
                    &ldquo;{opp.notes}&rdquo;
                  </p>
                )}

                {exploitsArr.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                      <span>🎯</span> AI Counter-Strategy Playbook
                    </span>
                    <ul className="space-y-1 text-xs text-emerald-300">
                      {exploitsArr.map((tip, i) => (
                        <li key={i} className="flex items-start gap-1.5 bg-emerald-950/30 p-1.5 rounded border border-emerald-800/40 text-[11px]">
                          <span className="text-amber-400 font-bold">›</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Opponent Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-amber-400 mb-1">
              {editingOpp ? "Edit Opponent Profile" : "Add New Opponent Profile"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter HUD statistics and player reads for real-time live table lookup.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Player Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Archetype</label>
                  <select
                    value={formData.archetype}
                    onChange={(e) => setFormData({ ...formData, archetype: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300"
                  >
                    <option value="TAG">TAG (Tight-Aggressive)</option>
                    <option value="LAG">LAG (Loose-Aggressive)</option>
                    <option value="Maniac">Maniac (Hyper-Aggro)</option>
                    <option value="Nit">Nit (Ultra-Tight Rock)</option>
                    <option value="GTO Wizard">GTO Wizard (Balanced)</option>
                    <option value="Fish">Fish / Calling Station</option>
                  </select>
                </div>
              </div>

              {/* HUD Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">VPIP %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.vpip}
                    onChange={(e) => setFormData({ ...formData, vpip: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">PFR %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.pfr}
                    onChange={(e) => setFormData({ ...formData, pfr: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">3-Bet %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.threeBet}
                    onChange={(e) => setFormData({ ...formData, threeBet: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">AF (Factor)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.aggressionFactor}
                    onChange={(e) => setFormData({ ...formData, aggressionFactor: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fold C-Bet %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.foldToCbet}
                    onChange={(e) => setFormData({ ...formData, foldToCbet: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">WTSD %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.wtsd}
                    onChange={(e) => setFormData({ ...formData, wtsd: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Player Reads & Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Over-values top pair, hates folding to turn check-raises..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  {editingOpp ? "Update Profile" : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
