"use client";

import React, { useState, useMemo } from "react";
import { generateHandMatrix, PRESET_RANGES } from "@/lib/poker-engine";
import { pokerSounds } from "@/lib/sound-effects";

export const RangeMatrix: React.FC = () => {
  const matrix = useMemo(() => generateHandMatrix(), []);

  // Selected hands map: { "AA": 100, "AKs": 100, ... }
  const [selectedHands, setSelectedHands] = useState<Record<string, number>>(
    PRESET_RANGES["GTO_UTG_15"].hands
  );
  const [currentWeight, setCurrentWeight] = useState<number>(100);
  const [sliderPct, setSliderPct] = useState<number>(15);
  const [rangeName, setRangeName] = useState<string>("Custom GTO Opening Range");
  const [saveSuccess, setSaveSuccess] = useState<string>("");

  // Calculate total combos and % percentage
  const { totalCombos, percentage } = useMemo(() => {
    let combos = 0;
    for (const row of matrix) {
      for (const cell of row) {
        const weight = selectedHands[cell.key] || 0;
        if (weight > 0) {
          combos += (cell.comboCount * weight) / 100;
        }
      }
    }
    const pct = (combos / 1326) * 100;
    return {
      totalCombos: Math.round(combos),
      percentage: Number(pct.toFixed(1)),
    };
  }, [matrix, selectedHands]);

  const toggleCell = (key: string) => {
    pokerSounds.playChipBet();
    setSelectedHands((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = currentWeight;
      }
      return next;
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESET_RANGES[presetKey];
    if (preset) {
      pokerSounds.playWinFanfare();
      setSelectedHands({ ...preset.hands });
      setRangeName(preset.label);
    }
  };

  const clearRange = () => {
    setSelectedHands({});
  };

  const selectAll = () => {
    const all: Record<string, number> = {};
    for (const row of matrix) {
      for (const cell of row) {
        all[cell.key] = 100;
      }
    }
    setSelectedHands(all);
  };

  const handleSliderChange = (newPct: number) => {
    setSliderPct(newPct);
    const targetCombos = (newPct / 100) * 1326;
    let accumulated = 0;
    const newHands: Record<string, number> = {};

    // Standard high-equity ordering
    for (const row of matrix) {
      for (const cell of row) {
        if (accumulated + cell.comboCount <= targetCombos) {
          newHands[cell.key] = 100;
          accumulated += cell.comboCount;
        }
      }
    }
    setSelectedHands(newHands);
  };

  const saveCustomRange = async () => {
    try {
      const res = await fetch("/api/range-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rangeName,
          selectedHands,
          comboCount: totalCombos,
          rangePercentage: percentage,
        }),
      });
      if (res.ok) {
        setSaveSuccess("Range preset saved!");
        pokerSounds.playWinFanfare();
        setTimeout(() => setSaveSuccess(""), 2000);
      }
    } catch {
      setSaveSuccess("Saved to local memory!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Range Matrix Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <h2 className="text-lg font-bold text-slate-100">13x13 Interactive Hand Range Grid</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            169 unique starting hands • Pairs (diagonal), Suited (upper right), Offsuit (lower left)
          </p>
        </div>

        {/* Live Combo Counter Badge */}
        <div className="flex items-center gap-4 bg-slate-950 px-5 py-2.5 rounded-xl border border-emerald-500/40">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Selected</span>
            <span className="text-base font-black text-emerald-400 font-mono">
              {totalCombos} / 1,326 Combos
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-slate-400">Range Coverage</span>
            <span className="text-base font-black text-amber-400 font-mono">
              {percentage}% of Hands
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid + Preset Controls Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* THE 13x13 GRID CANVAS */}
        <div className="lg:col-span-8 bg-slate-950/90 p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-2xl overflow-x-auto">
          <div className="min-w-[540px] space-y-1">
            {matrix.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1">
                {row.map((cell) => {
                  const weight = selectedHands[cell.key] || 0;
                  const isSelected = weight > 0;

                  // Color style depending on hand type
                  let baseStyle = "bg-slate-900 text-slate-400 border-slate-800/80 hover:border-amber-400/80";
                  if (isSelected) {
                    if (cell.type === "pair") {
                      baseStyle = "bg-gradient-to-br from-rose-600 to-rose-700 text-white font-black border-rose-400 shadow-sm shadow-rose-900/50";
                    } else if (cell.type === "suited") {
                      baseStyle = "bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black border-emerald-400 shadow-sm shadow-emerald-900/50";
                    } else {
                      baseStyle = "bg-gradient-to-br from-sky-600 to-blue-700 text-white font-black border-sky-400 shadow-sm shadow-blue-900/50";
                    }
                  }

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      onClick={() => toggleCell(cell.key)}
                      title={`${cell.key} (${cell.type}) - ${cell.comboCount} combos`}
                      className={`flex-1 h-8 sm:h-9 flex flex-col items-center justify-center rounded text-[11px] font-bold border transition-all cursor-pointer select-none ${baseStyle}`}
                    >
                      <span>{cell.key}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Grid Legend */}
          <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-600 inline-block" /> Pocket Pairs (Red)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600 inline-block" /> Suited (Green)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-sky-600 inline-block" /> Offsuit (Blue)
              </span>
            </div>
            <span className="font-mono text-[11px]">Click cell to toggle</span>
          </div>
        </div>

        {/* CONTROLS & GTO PRESET PICKER */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Slider Selector */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-slate-300">
                Range Percentage Slider
              </label>
              <span className="text-sm font-black text-amber-400 font-mono">{sliderPct}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={sliderPct}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Drag to automatically highlight the top {sliderPct}% of starting hands.
            </p>
          </div>

          {/* Weight Frequency Buttons */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              Active Selection Weight
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 75, 50, 25].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setCurrentWeight(w)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentWeight === w
                      ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {w}%
                </button>
              ))}
            </div>
          </div>

          {/* GTO Presets */}
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              GTO Archetype Presets
            </label>
            <div className="space-y-2">
              {Object.entries(PRESET_RANGES).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="w-full text-left p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/50 transition-all text-xs flex flex-col gap-0.5 cursor-pointer"
                >
                  <span className="font-bold text-amber-300">{preset.label}</span>
                  <span className="text-[10px] text-slate-400">{preset.description}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={selectAll}
                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearRange}
                className="flex-1 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-bold"
              >
                Clear Matrix
              </button>
            </div>
          </div>

          {/* Save Custom Range Template */}
          <div className="bg-slate-900/90 border border-amber-500/30 p-5 rounded-2xl space-y-3">
            <label className="text-xs font-bold uppercase text-slate-300 block">
              Save Custom Range Preset
            </label>
            <input
              type="text"
              value={rangeName}
              onChange={(e) => setRangeName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-amber-400"
            />
            {saveSuccess && (
              <p className="text-xs text-emerald-400 font-bold">✓ {saveSuccess}</p>
            )}
            <button
              type="button"
              onClick={saveCustomRange}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
            >
              Save Range to Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
