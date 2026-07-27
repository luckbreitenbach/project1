import { pgTable, text, timestamp, numeric, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  role: text("role").default("Pro Player"),
  bankroll: integer("bankroll").default(25000),
  preferredTheme: text("preferred_theme").default("emerald"),
  preferredSimRuns: integer("preferred_sim_runs").default(10000),
  soundEffects: boolean("sound_effects").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const opponentProfiles = pgTable("opponent_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  archetype: text("archetype").notNull(), // 'TAG' | 'LAG' | 'Nit' | 'Fish' | 'Maniac' | 'GTO Wizard' | 'Calling Station'
  vpip: numeric("vpip").default("24.0"),
  pfr: numeric("pfr").default("18.5"),
  threeBet: numeric("three_bet").default("7.8"),
  aggressionFactor: numeric("aggression_factor").default("2.8"),
  foldToCbet: numeric("fold_to_cbet").default("45.0"),
  wtsd: numeric("wtsd").default("26.0"),
  notes: text("notes"),
  exploits: text("exploits"), // JSON string array of exploitative tips
  colorTag: text("color_tag").default("emerald"),
  handsTracked: integer("hands_tracked").default(150),
  createdAt: timestamp("created_at").defaultNow(),
});

export const savedScenarios = pgTable("saved_scenarios", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  gameType: text("game_type").default("No-Limit Cash $5/$10"),
  heroCards: text("hero_cards").notNull(), // JSON string: ["As", "Kd"]
  boardCards: text("board_cards").notNull(), // JSON string: ["Ks", "7h", "2c"]
  opponentsData: text("opponents_data").notNull(), // JSON string
  potSize: numeric("pot_size").default("350"),
  betToCall: numeric("bet_to_call").default("120"),
  street: text("street").default("flop"),
  simulationRuns: integer("simulation_runs").default(10000),
  heroEquity: numeric("hero_equity").default("65.4"),
  heroWinPct: numeric("hero_win_pct").default("63.2"),
  heroTiePct: numeric("hero_tie_pct").default("2.2"),
  potOddsPct: numeric("pot_odds_pct").default("25.5"),
  evChips: numeric("ev_chips").default("185.0"),
  recommendation: text("recommendation").default("CALL / RAISE"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rangeTemplates = pgTable("range_templates", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").default("Preflop Open"),
  selectedHands: text("selected_hands").notNull(), // JSON string: {"AA":100, "KK":100, ...}
  comboCount: integer("combo_count").default(160),
  rangePercentage: numeric("range_percentage").default("12.1"),
  createdAt: timestamp("created_at").defaultNow(),
});
