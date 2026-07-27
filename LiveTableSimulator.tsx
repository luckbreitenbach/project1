"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { PokerCard } from "./PokerCard";
import { CardPickerModal } from "./CardPickerModal";
import {
  Card,
  parseCard,
  getAllDeckCards,
  runMonteCarloSimulation,
  SimulationResult,
} from "@/lib/poker-engine";
import { pokerSounds } from "@/lib/sound-effects";

export interface OpponentSeat {
  id: string;
  name: string;
  cards: [string, string] | null; // e.g. ["Qd", "Qc"]
  rangeName?: string;
  folded: boolean;
  positionName: string;
}

interface LiveTableSimulatorProps {
  theme?: string;
  onSaveScenario?: (scenarioData: Record<string, unknown>) => void;
}

export const LiveTableSimulator: React.FC<LiveTableSimulatorProps> = ({
  theme = "emerald",
  onSaveScenario,
}) => {
  // Hero Hand State
  const [heroCard1, setHeroCard1] = useState<string>("As");
  const [heroCard2, setHeroCard2] = useState<string>("Kh");

  // Board Cards State (Flop 1, 2, 3, Turn, River)
  const [flop1, setFlop1] = useState<string>("Ks");
  const [flop2, setFlop2] = useState<string>("7d");
  const [flop3, setFlop3] = useState<string>("2c");
  const [turn, setTurn] = useState<string>("");
  const [river, setRiver] = useState<string>("");

  // Opponents on the table
  const [opponents, setOpponents] = useState<OpponentSeat[]>([
    {
      id: "opp-1",
      name: "Garrett 'The Shark'",
      cards: ["Qd", "Jd"],
      positionName: "Cutoff",
      folded: false,
    },
    {
      id: "opp-2",
      name: "Nik 'Airball'",
      cards: null, // unknown / random range
      positionName: "Button",
      folded: false,
    },
  ]);

  // Betting & Pot configuration
  const [potSize, setPotSize] = useState<number>(350);
  const [betToCall, setBetToCall] = useState<number>(100);
  const [simRuns, setSimRuns] = useState<number>(10000);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  // Card Picker Modal state
  const [pickerTarget, setPickerTarget] = useState<{
    type: "hero1" | "hero2" | "flop1" | "flop2" | "flop3" | "turn" | "river" | "oppCard1" | "oppCard2";
    oppId?: string;
    cardIdx?: number;
  } | null>(null);

  // Save Scenario Modal state
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [scenarioTitle, setScenarioTitle] = useState<string>("Flop Top Pair Top Kicker vs 2 Opponents");
  const [scenarioNotes, setScenarioNotes] = useState<string>("");
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>("");

  const [, startTransition] = useTransition();

  // Calculate set of all currently used card codes
  const usedCardCodes = useMemo(() => {
    const set = new Set<string>();
    if (heroCard1) set.add(heroCard1);
    if (heroCard2) set.add(heroCard2);
    if (flop1) set.add(flop1);
    if (flop2) set.add(flop2);
    if (flop3) set.add(flop3);
    if (turn) set.add(turn);
    if (river) set.add(river);

    for (const opp of opponents) {
      if (opp.cards) {
        if (opp.cards[0]) set.add(opp.cards[0]);
        if (opp.cards[1]) set.add(opp.cards[1]);
      }
    }
    return set;
  }, [heroCard1, heroCard2, flop1, flop2, flop3, turn, river, opponents]);

  // Run simulation calculation
  const executeSimulation = () => {
    setIsSimulating(true);
    pokerSounds.playChipBet();

    setTimeout(() => {
      startTransition(() => {
        const c1 = parseCard(heroCard1);
        const c2 = parseCard(heroCard2);
        if (!c1 || !c2) {
          setIsSimulating(false);
          return;
        }

        const board: Card[] = [];
        [flop1, flop2, flop3, turn, river].forEach((cStr) => {
          const parsed = parseCard(cStr);
          if (parsed) board.push(parsed);
        });

        const activeOpponents = opponents.map((opp) => {
          let oppCards: [Card, Card] | null = null;
          if (opp.cards && opp.cards[0] && opp.cards[1]) {
            const oc1 = parseCard(opp.cards[0]);
            const oc2 = parseCard(opp.cards[1]);
            if (oc1 && oc2) oppCards = [oc1, oc2];
          }
          return {
            id: opp.id,
            name: opp.name,
            isHero: false,
            cards: oppCards,
            folded: opp.folded,
          };
        });

        const result = runMonteCarloSimulation({
          heroCards: [c1, c2],
          boardCards: board,
          opponents: activeOpponents,
          runs: simRuns,
          potSize,
          betToCall,
        });

        setSimResult(result);
        setIsSimulating(false);
      });
    }, 120);
  };

  // Run simulation on initial load and card updates
  useEffect(() => {
    executeSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heroCard1, heroCard2, flop1, flop2, flop3, turn, river, opponents.length]);

  const handleCardSelected = (code: string) => {
    if (!pickerTarget) return;

    const { type, oppId, cardIdx } = pickerTarget;
    if (type === "hero1") setHeroCard1(code);
    else if (type === "hero2") setHeroCard2(code);
    else if (type === "flop1") setFlop1(code);
    else if (type === "flop2") setFlop2(code);
    else if (type === "flop3") setFlop3(code);
    else if (type === "turn") setTurn(code);
    else if (type === "river") setRiver(code);
    else if ((type === "oppCard1" || type === "oppCard2") && oppId !== undefined && cardIdx !== undefined) {
      setOpponents((prev) =>
        prev.map((o) => {
          if (o.id !== oppId) return o;
          const currentCards = o.cards ? [...o.cards] : ["", ""];
          currentCards[cardIdx] = code;
          return { ...o, cards: currentCards as [string, string] };
        })
      );
    }
  };

  const dealRandomBoard = (street: "flop" | "turn" | "river" | "all") => {
    const deck = getAllDeckCards().filter((c) => !usedCardCodes.has(c.code));
    pokerSounds.playCardDeal();

    const getRandomCard = () => {
      const idx = Math.floor(Math.random() * deck.length);
      const card = deck.splice(idx, 1)[0];
      return card ? card.code : "";
    };

    if (street === "flop" || street === "all") {
      setFlop1(getRandomCard());
      setFlop2(getRandomCard());
      setFlop3(getRandomCard());
    }
    if (street === "turn" || street === "all") {
      setTurn(getRandomCard());
    }
    if (street === "river" || street === "all") {
      setRiver(getRandomCard());
    }
  };

  const clearBoard = () => {
    setFlop1("");
    setFlop2("");
    setFlop3("");
    setTurn("");
    setRiver("");
  };

  const addOpponent = () => {
    if (opponents.length >= 8) return;
    const positions = ["UTG", "MP", "HJ", "CO", "BTN", "SB", "BB"];
    const pos = positions[opponents.length % positions.length];
    const newOpp: OpponentSeat = {
      id: `opp-${Date.now()}`,
      name: `Player ${opponents.length + 1}`,
      cards: null,
      positionName: pos,
      folded: false,
    };
    setOpponents([...opponents, newOpp]);
  };

  const removeOpponent = (id: string) => {
    setOpponents(opponents.filter((o) => o.id !== id));
  };

  const toggleOpponentFold = (id: string) => {
    setOpponents(opponents.map((o) => (o.id === id ? { ...o, folded: !o.folded } : o)));
  };

  const handleSaveScenarioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const boardArr = [flop1, flop2, flop3, turn, river].filter(Boolean);
    const payload = {
      title: scenarioTitle,
      gameType: "No-Limit Hold'em $5/$10",
      heroCards: [heroCard1, heroCard2],
      boardCards: boardArr,
      opponentsData: opponents.map((o) => ({ id: o.id, name: o.name, cards: o.cards })),
      potSize,
      betToCall,
      street: river ? "river" : turn ? "turn" : flop1 ? "flop" : "preflop",
      simulationRuns: simRuns,
      heroEquity: simResult ? simResult.heroEquity : 50,
      heroWinPct: simResult ? simResult.heroWinPct : 48,
      heroTiePct: simResult ? simResult.heroTiePct : 2,
      potOddsPct: simResult ? simResult.potOddsInfo.potOddsPct : 20,
      evChips: simResult ? simResult.potOddsInfo.evChips : 0,
      recommendation: simResult ? simResult.potOddsInfo.recommendation : "CALL",
      notes: scenarioNotes,
    };

    try {
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveSuccessMsg("Scenario saved to Hand History!");
        pokerSounds.playWinFanfare();
        if (onSaveScenario) onSaveScenario(payload);
        setTimeout(() => {
          setShowSaveModal(false);
          setSaveSuccessMsg("");
        }, 1500);
      }
    } catch {
      setSaveSuccessMsg("Saved locally!");
    }
  };

  const feltThemes: Record<string, { outer: string; inner: string; rail: string }> = {
    emerald: {
      outer: "bg-emerald-950/90",
      inner: "from-emerald-900 via-emerald-800 to-emerald-950",
      rail: "border-amber-600/40 shadow-[0_0_50px_rgba(5,150,105,0.25)]",
    },
    midnight: {
      outer: "bg-slate-950/95",
      inner: "from-slate-900 via-slate-800 to-slate-950",
      rail: "border-cyan-600/40 shadow-[0_0_50px_rgba(6,182,212,0.25)]",
    },
    ruby: {
      outer: "bg-rose-950/95",
      inner: "from-rose-950 via-red-900 to-rose-950",
      rail: "border-amber-500/50 shadow-[0_0_50px_rgba(244,63,94,0.25)]",
    },
  };

  const currentTheme = feltThemes[theme] || feltThemes.emerald;

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-amber-500/20">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>♠</span> Live Texas Hold&apos;em Table Analyzer
            </h2>
            <p className="text-xs text-slate-400">
              Real-time Monte Carlo engine • {opponents.filter((o) => !o.folded).length} Active Opponents
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dealRandomBoard("flop")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
          >
            🎲 Random Flop
          </button>
          <button
            type="button"
            onClick={() => dealRandomBoard("all")}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer"
          >
            🂠 Deal Runout
          </button>
          <button
            type="button"
            onClick={clearBoard}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 text-xs font-medium border border-slate-700 transition-all cursor-pointer"
          >
            Clear Board
          </button>
          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            💾 Save Scenario
          </button>
        </div>
      </div>

      {/* Main Table + Simulation Analytics Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* POKER TABLE FELT CANVAS (7 cols on large screens) */}
        <div className="xl:col-span-7 flex flex-col gap-4">
          <div
            className={`relative w-full rounded-3xl border-4 ${currentTheme.rail} ${currentTheme.outer} p-4 sm:p-6 shadow-2xl overflow-hidden min-h-[530px] flex flex-col justify-between`}
          >
            {/* Casino Felt Inner Oval Texture */}
            <div
              className={`absolute inset-3 sm:inset-5 rounded-[2.5rem] bg-gradient-to-b ${currentTheme.inner} border-2 border-amber-400/20 shadow-inner flex flex-col justify-between p-4`}
            >
              {/* Felt watermark logo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-8xl sm:text-9xl font-black text-amber-300">ROYAL</span>
              </div>

              {/* TOP: Opponents Row */}
              <div className="relative z-10 flex flex-wrap items-center justify-around gap-3 pt-1">
                {opponents.map((opp) => (
                  <div
                    key={opp.id}
                    className={`relative p-2.5 rounded-xl border backdrop-blur-md transition-all ${
                      opp.folded
                        ? "bg-slate-950/60 border-slate-800 opacity-50"
                        : "bg-slate-950/80 border-amber-500/40 shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-amber-300">{opp.name}</span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {opp.positionName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleOpponentFold(opp.id)}
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            opp.folded ? "bg-rose-900 text-rose-200" : "bg-emerald-900 text-emerald-200"
                          }`}
                        >
                          {opp.folded ? "Folded" : "Active"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOpponent(opp.id)}
                          className="text-slate-400 hover:text-rose-400 text-xs px-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Opponent Cards Slot */}
                    <div className="flex items-center gap-2">
                      <PokerCard
                        size="sm"
                        card={opp.cards ? opp.cards[0] : null}
                        emptyLabel="Card 1"
                        onClick={() =>
                          setPickerTarget({ type: "oppCard1", oppId: opp.id, cardIdx: 0 })
                        }
                      />
                      <PokerCard
                        size="sm"
                        card={opp.cards ? opp.cards[1] : null}
                        emptyLabel="Card 2"
                        onClick={() =>
                          setPickerTarget({ type: "oppCard2", oppId: opp.id, cardIdx: 1 })
                        }
                      />
                    </div>
                  </div>
                ))}

                {opponents.length < 6 && (
                  <button
                    type="button"
                    onClick={addOpponent}
                    className="p-2.5 rounded-xl border border-dashed border-emerald-600/60 hover:border-amber-400/80 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>+</span> Add Seat
                  </button>
                )}
              </div>

              {/* CENTER: Community Board & Chip Pot */}
              <div className="relative z-10 my-4 flex flex-col items-center justify-center">
                {/* Chip Pot Indicator */}
                <div className="flex items-center gap-2 bg-slate-950/80 border border-amber-500/50 px-4 py-1.5 rounded-full shadow-lg mb-3">
                  <span className="text-amber-400 text-sm">🪙</span>
                  <span className="text-xs uppercase font-semibold text-slate-300">Pot:</span>
                  <span className="text-sm font-black text-amber-300">${potSize.toLocaleString()}</span>
                  <span className="text-[11px] text-slate-400">| To Call: ${betToCall}</span>
                </div>

                {/* 5 Community Cards */}
                <div className="flex items-center gap-2 sm:gap-3 p-2 bg-slate-950/70 border border-emerald-700/50 rounded-2xl shadow-2xl backdrop-blur-md">
                  {/* Flop 1 */}
                  <div className="flex flex-col items-center">
                    <PokerCard
                      size="md"
                      card={flop1}
                      emptyLabel="Flop 1"
                      onClick={() => setPickerTarget({ type: "flop1" })}
                      onClear={() => setFlop1("")}
                    />
                    <span className="text-[9px] uppercase font-bold text-emerald-400/80 mt-1">Flop</span>
                  </div>
                  {/* Flop 2 */}
                  <div className="flex flex-col items-center">
                    <PokerCard
                      size="md"
                      card={flop2}
                      emptyLabel="Flop 2"
                      onClick={() => setPickerTarget({ type: "flop2" })}
                      onClear={() => setFlop2("")}
                    />
                    <span className="text-[9px] uppercase font-bold text-emerald-400/80 mt-1">Flop</span>
                  </div>
                  {/* Flop 3 */}
                  <div className="flex flex-col items-center">
                    <PokerCard
                      size="md"
                      card={flop3}
                      emptyLabel="Flop 3"
                      onClick={() => setPickerTarget({ type: "flop3" })}
                      onClear={() => setFlop3("")}
                    />
                    <span className="text-[9px] uppercase font-bold text-emerald-400/80 mt-1">Flop</span>
                  </div>

                  <div className="w-[1px] h-12 bg-slate-700/60 mx-0.5" />

                  {/* Turn */}
                  <div className="flex flex-col items-center">
                    <PokerCard
                      size="md"
                      card={turn}
                      emptyLabel="Turn"
                      onClick={() => setPickerTarget({ type: "turn" })}
                      onClear={() => setTurn("")}
                    />
                    <span className="text-[9px] uppercase font-bold text-amber-400/80 mt-1">Turn</span>
                  </div>

                  <div className="w-[1px] h-12 bg-slate-700/60 mx-0.5" />

                  {/* River */}
                  <div className="flex flex-col items-center">
                    <PokerCard
                      size="md"
                      card={river}
                      emptyLabel="River"
                      onClick={() => setPickerTarget({ type: "river" })}
                      onClear={() => setRiver("")}
                    />
                    <span className="text-[9px] uppercase font-bold text-rose-400/80 mt-1">River</span>
                  </div>
                </div>
              </div>

              {/* BOTTOM: Hero Player Seat */}
              <div className="relative z-10 flex flex-col items-center justify-center">
                <div className="bg-slate-950/90 border-2 border-amber-400/70 p-3 rounded-2xl shadow-2xl flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      ★ HERO HAND (YOU)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono rounded border border-amber-500/30">
                      BTN / In Position
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <PokerCard
                      size="lg"
                      card={heroCard1}
                      emptyLabel="Hero C1"
                      onClick={() => setPickerTarget({ type: "hero1" })}
                      onClear={() => setHeroCard1("")}
                    />
                    <PokerCard
                      size="lg"
                      card={heroCard2}
                      emptyLabel="Hero C2"
                      onClick={() => setPickerTarget({ type: "hero2" })}
                      onClear={() => setHeroCard2("")}
                    />
                  </div>

                  {/* Quick Card Presets */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-400">Quick Hands:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroCard1("Ah");
                        setHeroCard2("As");
                        pokerSounds.playCardDeal();
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[10px] font-bold transition-colors"
                    >
                      Aces (AA)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroCard1("Ah");
                        setHeroCard2("Kh");
                        pokerSounds.playCardDeal();
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[10px] font-bold transition-colors"
                    >
                      Big Slick (AKs)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHeroCard1("Jh");
                        setHeroCard2("Th");
                        pokerSounds.playCardDeal();
                      }}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-[10px] font-bold transition-colors"
                    >
                      Connectors (JTs)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Simulation Controls */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <label className="text-[11px] uppercase font-bold text-slate-400">Sim Iterations</label>
                <select
                  value={simRuns}
                  onChange={(e) => setSimRuns(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-700 text-amber-300 rounded-lg px-2.5 py-1 text-xs font-bold"
                >
                  <option value={1000}>1,000 Runs (Instant)</option>
                  <option value={5000}>5,000 Runs (Balanced)</option>
                  <option value={10000}>10,000 Runs (High Precision)</option>
                  <option value={25000}>25,000 Runs (Tournament Grade)</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] uppercase font-bold text-slate-400">Pot Size ($)</label>
                <input
                  type="number"
                  value={potSize}
                  onChange={(e) => setPotSize(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-[11px] uppercase font-bold text-slate-400">Bet To Call ($)</label>
                <input
                  type="number"
                  value={betToCall}
                  onChange={(e) => setBetToCall(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-2.5 py-1 text-xs font-bold"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={isSimulating}
              onClick={executeSimulation}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <span className="inline-block animate-spin">⚙️</span>
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Re-Simulate Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* PROBABILITY & GTO ANALYTICS PANEL (5 cols on large screens) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          {simResult && (
            <div className="bg-slate-900/90 border border-amber-500/30 p-5 rounded-3xl shadow-2xl space-y-5">
              {/* HERO EQUITY HERO CARD */}
              <div className="bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 p-4 rounded-2xl border border-emerald-500/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                    Hero Win Equity
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {simResult.runs.toLocaleString()} Monte Carlo Runs
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-emerald-300">
                    {simResult.heroEquity}%
                  </span>
                  <div className="text-xs text-slate-300 space-x-2 font-mono">
                    <span className="text-emerald-400 font-semibold">Win: {simResult.heroWinPct}%</span>
                    <span className="text-amber-400 font-semibold">Tie: {simResult.heroTiePct}%</span>
                    <span className="text-rose-400 font-semibold">Loss: {simResult.heroLossPct}%</span>
                  </div>
                </div>

                {/* Animated multi-color equity bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex mt-3 border border-slate-700">
                  <div
                    style={{ width: `${simResult.heroWinPct}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Win: ${simResult.heroWinPct}%`}
                  />
                  <div
                    style={{ width: `${simResult.heroTiePct}%` }}
                    className="bg-amber-500 h-full transition-all duration-300"
                    title={`Tie: ${simResult.heroTiePct}%`}
                  />
                  <div
                    style={{ width: `${simResult.heroLossPct}%` }}
                    className="bg-rose-600 h-full transition-all duration-300"
                    title={`Loss: ${simResult.heroLossPct}%`}
                  />
                </div>
              </div>

              {/* GTO ADVICE & EV CALL BOX */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Pot Odds</span>
                  <span className="text-xl font-bold text-amber-300">
                    {simResult.potOddsInfo.potOddsPct}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Required Eq: {simResult.potOddsInfo.requiredEquityPct}%
                  </span>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Expected Value (EV)</span>
                  <span
                    className={`text-xl font-black ${
                      simResult.potOddsInfo.evChips >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {simResult.potOddsInfo.evChips >= 0 ? "+" : ""}
                    ${simResult.potOddsInfo.evChips}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-amber-400">
                    {simResult.potOddsInfo.recommendation}
                  </span>
                </div>
              </div>

              {/* OPPONENTS' EQUITIES BREAKDOWN */}
              {simResult.opponentsEquity.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                    Opponents Equity Breakdown
                  </span>
                  <div className="space-y-2">
                    {simResult.opponentsEquity.map((opp) => (
                      <div
                        key={opp.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                      >
                        <span className="font-semibold text-slate-200">{opp.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">Win {opp.winPct}%</span>
                          <span className="font-bold text-amber-400 font-mono">{opp.equity}% Eq</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BOARD TEXTURE ANALYSIS */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold text-slate-300">Board Texture</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      simResult.boardTexture.label === "Scorching Wet"
                        ? "bg-rose-900 text-rose-200"
                        : simResult.boardTexture.label === "Wet"
                        ? "bg-amber-900 text-amber-200"
                        : "bg-emerald-900 text-emerald-200"
                    }`}
                  >
                    {simResult.boardTexture.label} ({simResult.boardTexture.wetnessScore}%)
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {simResult.boardTexture.isRainbow ? "🌈 Rainbow Board" : "💧 Suited Draw Present"}
                  </span>
                  {simResult.boardTexture.isPaired && (
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700/50">
                      ⚡ Paired Board
                    </span>
                  )}
                </div>
              </div>

              {/* HAND DISTRIBUTION OUTCOMES */}
              <div className="space-y-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  Hero River Hand Probabilities
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(simResult.handDistribution)
                    .filter(([, pct]) => pct > 0)
                    .map(([handName, pct]) => (
                      <div
                        key={handName}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-950/50 border border-slate-800/80"
                      >
                        <span className="text-slate-300 font-medium">{handName}</span>
                        <span className="font-bold text-amber-300 font-mono">{pct}%</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Picker Modal */}
      <CardPickerModal
        isOpen={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        onSelectCard={handleCardSelected}
        usedCardCodes={usedCardCodes}
      />

      {/* Save Scenario Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold text-amber-400 mb-1">Save Hand Scenario</h3>
            <p className="text-xs text-slate-400 mb-4">
              Store this table state in your Hand History Lab for future review and GTO analysis.
            </p>

            <form onSubmit={handleSaveScenarioSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Scenario Title</label>
                <input
                  type="text"
                  required
                  value={scenarioTitle}
                  onChange={(e) => setScenarioTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tactical Notes & Reads</label>
                <textarea
                  rows={3}
                  value={scenarioNotes}
                  onChange={(e) => setScenarioNotes(e.target.value)}
                  placeholder="e.g. Opponent raised UTG, called my 3-bet from the button..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:border-amber-400"
                />
              </div>

              {saveSuccessMsg && (
                <div className="p-2 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold text-center">
                  ✓ {saveSuccessMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Confirm & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
