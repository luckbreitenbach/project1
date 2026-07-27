"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { LiveTableSimulator } from "@/components/LiveTableSimulator";
import { RangeMatrix } from "@/components/RangeMatrix";
import { OpponentProfiler } from "@/components/OpponentProfiler";
import { SavedScenariosLab, SavedScenarioItem } from "@/components/SavedScenariosLab";
import { PotOddsCalculator } from "@/components/PotOddsCalculator";
import { SettingsModal } from "@/components/SettingsModal";
import { INITIAL_DEMO_USER } from "@/lib/seed-data";
import { pokerSounds } from "@/lib/sound-effects";

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>("table");
  const [currentTheme, setCurrentTheme] = useState<string>("emerald");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [user, setUser] = useState({
    name: INITIAL_DEMO_USER.name,
    email: INITIAL_DEMO_USER.email,
    role: INITIAL_DEMO_USER.role,
    bankroll: INITIAL_DEMO_USER.bankroll,
    preferredTheme: "emerald",
    preferredSimRuns: 10000,
    soundEffects: true,
  });

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.preferredTheme) {
          setCurrentTheme(data.user.preferredTheme);
        }
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleQuickPersonaSwitch = async (persona: "kidpoker" | "valkyrie" | "sammy") => {
    pokerSounds.playWinFanfare();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        if (data.user.preferredTheme) {
          setCurrentTheme(data.user.preferredTheme);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleLoadScenarioIntoTable = (scenario: SavedScenarioItem) => {
    setActiveTab("table");
    pokerSounds.playWinFanfare();
    console.log("Loaded scenario into live table:", scenario.title);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Top Luxury Casino Navigation Bar */}
      <Header
        user={user}
        currentTheme={currentTheme}
        onChangeTheme={(t) => setCurrentTheme(t)}
        onQuickPersonaSwitch={handleQuickPersonaSwitch}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Full-Stack Application Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sleek Sidebar */}
        <Sidebar activeTab={activeTab} onChangeTab={(tab) => setActiveTab(tab)} />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          {activeTab === "table" && (
            <LiveTableSimulator
              theme={currentTheme}
              onSaveScenario={() => {
                // Scenario saved callback
              }}
            />
          )}

          {activeTab === "ranges" && <RangeMatrix />}

          {activeTab === "opponents" && <OpponentProfiler />}

          {activeTab === "scenarios" && (
            <SavedScenariosLab onLoadScenario={handleLoadScenarioIntoTable} />
          )}

          {activeTab === "pot-odds" && <PotOddsCalculator />}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
        onQuickPersonaSwitch={handleQuickPersonaSwitch}
      />
    </div>
  );
}
