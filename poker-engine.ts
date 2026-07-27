// Texas Hold'em Hand Evaluator & Monte Carlo Probability Engine

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
  code: string; // e.g. "As", "Kh"
}

export const RANKS: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const SUIT_SYMBOLS: Record<Suit, { symbol: string; label: string; color: string; bg: string }> = {
  s: { symbol: '♠', label: 'Spades', color: 'text-slate-200', bg: 'bg-slate-800' },
  h: { symbol: '♥', label: 'Hearts', color: 'text-rose-500', bg: 'bg-rose-950/40' },
  d: { symbol: '♦', label: 'Diamonds', color: 'text-amber-400', bg: 'bg-amber-950/40' },
  c: { symbol: '♣', label: 'Clubs', color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
};

export function getAllDeckCards(): Card[] {
  const deck: Card[] = [];
  for (const rank of ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as Rank[]) {
    for (const suit of ['s', 'h', 'd', 'c'] as Suit[]) {
      deck.push({ rank, suit, code: `${rank}${suit}` });
    }
  }
  return deck;
}

export function parseCard(cardStr: string): Card | null {
  if (!cardStr || cardStr.length < 2) return null;
  const rank = cardStr[0].toUpperCase() as Rank;
  const suit = cardStr[1].toLowerCase() as Suit;
  if (!RANK_VALUES[rank] || !SUITS.includes(suit)) return null;
  return { rank, suit, code: `${rank}${suit}` };
}

export enum HandRankType {
  HighCard = 0,
  OnePair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export const HAND_RANK_NAMES: Record<HandRankType, string> = {
  [HandRankType.HighCard]: 'High Card',
  [HandRankType.OnePair]: 'One Pair',
  [HandRankType.TwoPair]: 'Two Pair',
  [HandRankType.ThreeOfAKind]: 'Three of a Kind',
  [HandRankType.Straight]: 'Straight',
  [HandRankType.Flush]: 'Flush',
  [HandRankType.FullHouse]: 'Full House',
  [HandRankType.FourOfAKind]: 'Four of a Kind',
  [HandRankType.StraightFlush]: 'Straight Flush',
  [HandRankType.RoyalFlush]: 'Royal Flush',
};

export interface EvaluatedHand {
  type: HandRankType;
  name: string;
  score: number; // numerical score for exact comparison
  description: string;
}

// 7-card (or 5-6 card) Hold'em hand evaluator
export function evaluate7Cards(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    return { type: HandRankType.HighCard, name: 'Incomplete Hand', score: 0, description: 'Less than 5 cards' };
  }

  // Count rank occurrences and group by suits
  const rankCounts: Record<number, number> = {};
  const suitCards: Record<Suit, number[]> = { s: [], h: [], d: [], c: [] };
  const ranksList: number[] = [];

  for (const c of cards) {
    const val = RANK_VALUES[c.rank];
    rankCounts[val] = (rankCounts[val] || 0) + 1;
    suitCards[c.suit].push(val);
    ranksList.push(val);
  }

  // 1. Check for Flush and Straight Flush / Royal Flush
  for (const suit of SUITS) {
    if (suitCards[suit].length >= 5) {
      const flushVals = suitCards[suit].sort((a, b) => b - a);
      // Check straight flush within flush cards
      const sfHigh = getStraightHigh(flushVals);
      if (sfHigh !== null) {
        if (sfHigh === 14) {
          return {
            type: HandRankType.RoyalFlush,
            name: 'Royal Flush',
            score: 90000000 + sfHigh,
            description: `Royal Flush (${SUIT_SYMBOLS[suit].label})`,
          };
        }
        return {
          type: HandRankType.StraightFlush,
          name: 'Straight Flush',
          score: 80000000 + sfHigh,
          description: `Straight Flush to ${getRankSymbol(sfHigh)}`,
        };
      }
      // Standard Flush
      const top5Flush = flushVals.slice(0, 5);
      const flushScore = 50000000 + top5Flush[0] * 10000 + top5Flush[1] * 1000 + top5Flush[2] * 100 + top5Flush[3] * 10 + top5Flush[4];
      return {
        type: HandRankType.Flush,
        name: 'Flush',
        score: flushScore,
        description: `Flush (${getRankSymbol(top5Flush[0])} high)`,
      };
    }
  }

  // Group ranks by frequency
  const fourRanks: number[] = [];
  const threeRanks: number[] = [];
  const pairRanks: number[] = [];
  const singleRanks: number[] = [];

  const uniqueRanksDesc = Object.keys(rankCounts).map(Number).sort((a, b) => b - a);

  for (const r of uniqueRanksDesc) {
    const count = rankCounts[r];
    if (count === 4) fourRanks.push(r);
    else if (count === 3) threeRanks.push(r);
    else if (count === 2) pairRanks.push(r);
    else singleRanks.push(r);
  }

  // 2. Four of a Kind
  if (fourRanks.length > 0) {
    const quad = fourRanks[0];
    const kickers = uniqueRanksDesc.filter(r => r !== quad);
    const kicker = kickers[0] || 0;
    return {
      type: HandRankType.FourOfAKind,
      name: 'Four of a Kind',
      score: 70000000 + quad * 1000 + kicker,
      description: `Four of a Kind (${getRankSymbol(quad)}s)`,
    };
  }

  // 3. Full House
  if ((threeRanks.length >= 1 && pairRanks.length >= 1) || threeRanks.length >= 2) {
    const trip = threeRanks[0];
    const pair = threeRanks.length >= 2 ? threeRanks[1] : pairRanks[0];
    return {
      type: HandRankType.FullHouse,
      name: 'Full House',
      score: 60000000 + trip * 1000 + pair,
      description: `Full House (${getRankSymbol(trip)}s full of ${getRankSymbol(pair)}s)`,
    };
  }

  // 4. Straight
  const straightHigh = getStraightHigh(uniqueRanksDesc);
  if (straightHigh !== null) {
    return {
      type: HandRankType.Straight,
      name: 'Straight',
      score: 40000000 + straightHigh,
      description: `Straight to ${getRankSymbol(straightHigh)}`,
    };
  }

  // 5. Three of a Kind
  if (threeRanks.length > 0) {
    const trip = threeRanks[0];
    const kickers = uniqueRanksDesc.filter(r => r !== trip).slice(0, 2);
    const score = 30000000 + trip * 10000 + (kickers[0] || 0) * 100 + (kickers[1] || 0);
    return {
      type: HandRankType.ThreeOfAKind,
      name: 'Three of a Kind',
      score,
      description: `Three of a Kind (${getRankSymbol(trip)}s)`,
    };
  }

  // 6. Two Pair
  if (pairRanks.length >= 2) {
    const p1 = pairRanks[0];
    const p2 = pairRanks[1];
    const kickers = uniqueRanksDesc.filter(r => r !== p1 && r !== p2);
    const kicker = kickers[0] || 0;
    const score = 20000000 + p1 * 10000 + p2 * 100 + kicker;
    return {
      type: HandRankType.TwoPair,
      name: 'Two Pair',
      score,
      description: `Two Pair (${getRankSymbol(p1)}s and ${getRankSymbol(p2)}s)`,
    };
  }

  // 7. One Pair
  if (pairRanks.length === 1) {
    const p = pairRanks[0];
    const kickers = uniqueRanksDesc.filter(r => r !== p).slice(0, 3);
    const score = 10000000 + p * 10000 + (kickers[0] || 0) * 100 + (kickers[1] || 0) * 10 + (kickers[2] || 0);
    return {
      type: HandRankType.OnePair,
      name: 'One Pair',
      score,
      description: `One Pair of ${getRankSymbol(p)}s`,
    };
  }

  // 8. High Card
  const top5 = uniqueRanksDesc.slice(0, 5);
  const score = (top5[0] || 0) * 10000 + (top5[1] || 0) * 1000 + (top5[2] || 0) * 100 + (top5[3] || 0) * 10 + (top5[4] || 0);
  return {
    type: HandRankType.HighCard,
    name: 'High Card',
    score,
    description: `High Card (${getRankSymbol(top5[0])})`,
  };
}

function getStraightHigh(sortedUniqueRanks: number[]): number | null {
  const ranks = [...sortedUniqueRanks];
  if (ranks.includes(14)) ranks.push(1); // Ace can be low (A-2-3-4-5)

  let consecutive = 1;
  for (let i = 0; i < ranks.length - 1; i++) {
    if (ranks[i] - 1 === ranks[i + 1]) {
      consecutive++;
      if (consecutive >= 5) {
        return ranks[i - 3]; // Return the highest card of the 5-card sequence
      }
    } else if (ranks[i] !== ranks[i + 1]) {
      consecutive = 1;
    }
  }
  return null;
}

function getRankSymbol(val: number): string {
  for (const [r, v] of Object.entries(RANK_VALUES)) {
    if (v === val) return r;
  }
  return String(val);
}

// Player simulation configuration
export interface SimPlayer {
  id: string;
  name: string;
  isHero: boolean;
  cards: [Card, Card] | null; // specific known cards
  rangeMatrix?: Record<string, number>; // e.g. {"AA": 100, "AKs": 100, "AKo": 75}
  rangeString?: string;
  folded?: boolean;
}

export interface SimulationResult {
  runs: number;
  heroEquity: number; // percentage (0 - 100)
  heroWinPct: number;
  heroTiePct: number;
  heroLossPct: number;
  opponentsEquity: Array<{
    id: string;
    name: string;
    winPct: number;
    tiePct: number;
    equity: number;
  }>;
  handDistribution: Record<string, number>; // distribution of Hero's final hands in %
  potOddsInfo: {
    potOddsPct: number;
    requiredEquityPct: number;
    evChips: number;
    profitableCall: boolean;
    recommendation: string;
  };
  boardTexture: {
    wetnessScore: number; // 0 to 100
    label: 'Dry' | 'Medium' | 'Wet' | 'Scorching Wet';
    isRainbow: boolean;
    isMonotone: boolean;
    isPaired: boolean;
  };
}

// Fast Monte Carlo Simulator Engine
export function runMonteCarloSimulation({
  heroCards,
  boardCards,
  opponents,
  runs = 5000,
  potSize = 200,
  betToCall = 50,
}: {
  heroCards: [Card, Card];
  boardCards: Card[];
  opponents: SimPlayer[];
  runs?: number;
  potSize?: number;
  betToCall?: number;
}): SimulationResult {
  const activeOpponents = opponents.filter(o => !o.folded && !o.isHero);
  if (activeOpponents.length === 0) {
    return createDefaultResult(runs, potSize, betToCall);
  }

  // Dead cards (cards already on board or in Hero's hand or known opponent hands)
  const deadCodes = new Set<string>();
  deadCodes.add(heroCards[0].code);
  deadCodes.add(heroCards[1].code);
  for (const b of boardCards) deadCodes.add(b.code);
  for (const opp of activeOpponents) {
    if (opp.cards) {
      deadCodes.add(opp.cards[0].code);
      deadCodes.add(opp.cards[1].code);
    }
  }

  const allDeck = getAllDeckCards();
  const availableDeck = allDeck.filter(c => !deadCodes.has(c.code));

  let heroWins = 0;
  let heroTies = 0;
  const oppWins: Record<string, number> = {};
  const oppTies: Record<string, number> = {};
  const handTypeCounts: Record<HandRankType, number> = {
    [HandRankType.HighCard]: 0,
    [HandRankType.OnePair]: 0,
    [HandRankType.TwoPair]: 0,
    [HandRankType.ThreeOfAKind]: 0,
    [HandRankType.Straight]: 0,
    [HandRankType.Flush]: 0,
    [HandRankType.FullHouse]: 0,
    [HandRankType.FourOfAKind]: 0,
    [HandRankType.StraightFlush]: 0,
    [HandRankType.RoyalFlush]: 0,
  };

  for (const opp of activeOpponents) {
    oppWins[opp.id] = 0;
    oppTies[opp.id] = 0;
  }

  const neededBoardCount = 5 - boardCards.length;

  for (let run = 0; run < runs; run++) {
    // Shuffle available deck copy using Fisher-Yates
    const deck = [...availableDeck];
    let deckIdx = deck.length - 1;

    // Deal random cards for opponents without known cards
    const currentOppHands: Array<{ id: string; cards: [Card, Card] }> = [];

    for (const opp of activeOpponents) {
      if (opp.cards) {
        currentOppHands.push({ id: opp.id, cards: opp.cards });
      } else {
        // Pick 2 random cards from remaining deck
        const c1Idx = Math.floor(Math.random() * (deckIdx + 1));
        const c1 = deck[c1Idx];
        deck[c1Idx] = deck[deckIdx];
        deckIdx--;

        const c2Idx = Math.floor(Math.random() * (deckIdx + 1));
        const c2 = deck[c2Idx];
        deck[c2Idx] = deck[deckIdx];
        deckIdx--;

        currentOppHands.push({ id: opp.id, cards: [c1, c2] });
      }
    }

    // Complete the board
    const simBoard = [...boardCards];
    for (let b = 0; b < neededBoardCount; b++) {
      const bIdx = Math.floor(Math.random() * (deckIdx + 1));
      simBoard.push(deck[bIdx]);
      deck[bIdx] = deck[deckIdx];
      deckIdx--;
    }

    // Evaluate Hero hand
    const heroHand = evaluate7Cards([...heroCards, ...simBoard]);
    handTypeCounts[heroHand.type]++;

    let heroBestScore = heroHand.score;
    let maxOppScore = -1;
    let bestOpponents: string[] = [];

    for (const opp of currentOppHands) {
      const oppHand = evaluate7Cards([...opp.cards, ...simBoard]);
      if (oppHand.score > maxOppScore) {
        maxOppScore = oppHand.score;
        bestOpponents = [opp.id];
      } else if (oppHand.score === maxOppScore) {
        bestOpponents.push(opp.id);
      }
    }

    if (heroBestScore > maxOppScore) {
      heroWins++;
    } else if (heroBestScore === maxOppScore) {
      heroTies++;
      for (const oppId of bestOpponents) {
        oppTies[oppId]++;
      }
    } else {
      if (bestOpponents.length === 1) {
        oppWins[bestOpponents[0]]++;
      } else {
        for (const oppId of bestOpponents) {
          oppTies[oppId]++;
        }
      }
    }
  }

  const heroWinPct = (heroWins / runs) * 100;
  const heroTiePct = (heroTies / runs) * 100;
  const heroEquity = heroWinPct + heroTiePct / (activeOpponents.length + 1);
  const heroLossPct = 100 - heroWinPct - heroTiePct;

  const opponentsEquity = activeOpponents.map(opp => {
    const wPct = (oppWins[opp.id] / runs) * 100;
    const tPct = (oppTies[opp.id] / runs) * 100;
    const eq = wPct + tPct / (activeOpponents.length + 1);
    return {
      id: opp.id,
      name: opp.name,
      winPct: Number(wPct.toFixed(1)),
      tiePct: Number(tPct.toFixed(1)),
      equity: Number(eq.toFixed(1)),
    };
  });

  // Calculate hand distribution breakdown
  const handDistribution: Record<string, number> = {};
  for (const [key, count] of Object.entries(handTypeCounts)) {
    const handName = HAND_RANK_NAMES[Number(key) as HandRankType];
    handDistribution[handName] = Number(((count / runs) * 100).toFixed(1));
  }

  // Pot odds & EV calculations
  const totalPotAfterCall = potSize + betToCall;
  const potOddsPct = betToCall > 0 ? (betToCall / (totalPotAfterCall + betToCall)) * 100 : 0;
  const requiredEquityPct = potOddsPct;
  const evChips = betToCall > 0 ? (heroEquity / 100) * totalPotAfterCall - ((100 - heroEquity) / 100) * betToCall : 0;
  const profitableCall = heroEquity >= requiredEquityPct;

  let recommendation = "CHECK / CALL";
  if (heroEquity >= 75) recommendation = "VALUE RAISE / ALL-IN";
  else if (heroEquity >= 55) recommendation = "STRONG BET / CALL";
  else if (profitableCall) recommendation = "PROFITABLE CALL (+EV)";
  else if (heroEquity >= 35) recommendation = "MARGINAL / SEMI-BLUFF";
  else recommendation = "FOLD (-EV)";

  // Board texture analysis
  const boardTexture = analyzeBoardTexture(boardCards);

  return {
    runs,
    heroEquity: Number(heroEquity.toFixed(1)),
    heroWinPct: Number(heroWinPct.toFixed(1)),
    heroTiePct: Number(heroTiePct.toFixed(1)),
    heroLossPct: Number(heroLossPct.toFixed(1)),
    opponentsEquity,
    handDistribution,
    potOddsInfo: {
      potOddsPct: Number(potOddsPct.toFixed(1)),
      requiredEquityPct: Number(requiredEquityPct.toFixed(1)),
      evChips: Number(evChips.toFixed(1)),
      profitableCall,
      recommendation,
    },
    boardTexture,
  };
}

function createDefaultResult(runs: number, potSize: number, betToCall: number): SimulationResult {
  return {
    runs,
    heroEquity: 100,
    heroWinPct: 100,
    heroTiePct: 0,
    heroLossPct: 0,
    opponentsEquity: [],
    handDistribution: { 'High Card': 100 },
    potOddsInfo: {
      potOddsPct: 0,
      requiredEquityPct: 0,
      evChips: potSize,
      profitableCall: true,
      recommendation: "ALL-IN / VALUE BET",
    },
    boardTexture: {
      wetnessScore: 10,
      label: 'Dry',
      isRainbow: true,
      isMonotone: false,
      isPaired: false,
    },
  };
}

function analyzeBoardTexture(board: Card[]) {
  if (board.length === 0) {
    return { wetnessScore: 0, label: 'Dry' as const, isRainbow: true, isMonotone: false, isPaired: false };
  }

  const suits: Record<string, number> = {};
  const ranks: number[] = [];

  for (const c of board) {
    suits[c.suit] = (suits[c.suit] || 0) + 1;
    ranks.push(RANK_VALUES[c.rank]);
  }

  const maxSuitCount = Math.max(...Object.values(suits));
  const isMonotone = maxSuitCount >= 3;
  const isRainbow = Object.keys(suits).length === board.length;

  const uniqueRanks = new Set(ranks);
  const isPaired = uniqueRanks.size < board.length;

  let wetnessScore = 15;
  if (isMonotone) wetnessScore += 35;
  if (maxSuitCount === 2 && board.length >= 3) wetnessScore += 15;
  if (isPaired) wetnessScore += 10;

  // Connectedness
  ranks.sort((a, b) => a - b);
  let gaps = 0;
  for (let i = 0; i < ranks.length - 1; i++) {
    const diff = Math.abs(ranks[i + 1] - ranks[i]);
    if (diff <= 2) wetnessScore += 12;
    if (diff > 4) gaps++;
  }

  wetnessScore = Math.min(100, Math.max(5, wetnessScore));
  let label: 'Dry' | 'Medium' | 'Wet' | 'Scorching Wet' = 'Dry';
  if (wetnessScore > 75) label = 'Scorching Wet';
  else if (wetnessScore > 50) label = 'Wet';
  else if (wetnessScore > 30) label = 'Medium';

  return { wetnessScore, label, isRainbow, isMonotone, isPaired };
}

// 13x13 Texas Hold'em Hand Range Grid Matrix Helpers
export function generateHandMatrix() {
  const matrix: Array<Array<{ key: string; type: 'pair' | 'suited' | 'offsuit'; comboCount: number }>> = [];

  for (let r1 = 0; r1 < 13; r1++) {
    const row: Array<{ key: string; type: 'pair' | 'suited' | 'offsuit'; comboCount: number }> = [];
    for (let r2 = 0; r2 < 13; r2++) {
      const card1 = RANKS[r1];
      const card2 = RANKS[r2];

      if (r1 === r2) {
        // Pocket Pair (AA, KK, etc.)
        row.push({ key: `${card1}${card2}`, type: 'pair', comboCount: 6 });
      } else if (r1 < r2) {
        // Suited (AKs, AQs, etc.)
        row.push({ key: `${card1}${card2}s`, type: 'suited', comboCount: 4 });
      } else {
        // Offsuit (AKo, AQo, etc.)
        row.push({ key: `${card2}${card1}o`, type: 'offsuit', comboCount: 12 });
      }
    }
    matrix.push(row);
  }
  return matrix;
}

export const PRESET_RANGES: Record<string, { label: string; description: string; hands: Record<string, number> }> = {
  'GTO_UTG_15': {
    label: 'UTG Tight-Aggressive (15%)',
    description: 'Under the Gun tight standard GTO opening range',
    hands: {
      'AA': 100, 'KK': 100, 'QQ': 100, 'JJ': 100, 'TT': 100, '99': 100, '88': 75, '77': 50,
      'AKs': 100, 'AQs': 100, 'AJs': 100, 'ATs': 100, 'KQs': 100, 'KJs': 100, 'QJs': 100, 'JTs': 100,
      'AKo': 100, 'AQo': 100, 'AJo': 50, 'KQo': 50, 'T9s': 75, '98s': 50
    }
  },
  'BTN_OPEN_45': {
    label: 'Button Steal / Wide Open (45%)',
    description: 'Button late position dynamic attacking range',
    hands: {
      'AA': 100, 'KK': 100, 'QQ': 100, 'JJ': 100, 'TT': 100, '99': 100, '88': 100, '77': 100, '66': 100, '55': 100, '44': 100, '33': 100, '22': 100,
      'AKs': 100, 'AQs': 100, 'AJs': 100, 'ATs': 100, 'A9s': 100, 'A8s': 100, 'A7s': 100, 'A6s': 100, 'A5s': 100, 'A4s': 100, 'A3s': 100, 'A2s': 100,
      'KQs': 100, 'KJs': 100, 'KTs': 100, 'K9s': 100, 'K8s': 75, 'K7s': 50,
      'QJs': 100, 'QTs': 100, 'Q9s': 100, 'Q8s': 75,
      'JTs': 100, 'J9s': 100, 'T9s': 100, '98s': 100, '87s': 100, '76s': 100, '65s': 100, '54s': 100,
      'AKo': 100, 'AQo': 100, 'AJo': 100, 'ATo': 100, 'A9o': 75, 'KQo': 100, 'KJo': 100, 'KTo': 75, 'QJo': 100, 'QTo': 75, 'JTo': 75
    }
  },
  'THREE_BET_VALUE': {
    label: '3-Bet Value & Shove (8%)',
    description: 'High pressure 3-betting premium range',
    hands: {
      'AA': 100, 'KK': 100, 'QQ': 100, 'JJ': 100, 'TT': 75,
      'AKs': 100, 'AQs': 100, 'AJs': 75, 'A5s': 100, 'A4s': 75,
      'AKo': 100, 'AQo': 75
    }
  },
  'FISH_CALLING_STATION': {
    label: 'Loose-Passive Calling Station (65%)',
    description: 'Plays any two suited cards, broadways, and all pairs',
    hands: {
      'AA': 100, 'KK': 100, 'QQ': 100, 'JJ': 100, 'TT': 100, '99': 100, '88': 100, '77': 100, '66': 100, '55': 100, '44': 100, '33': 100, '22': 100,
      'AKs': 100, 'AQs': 100, 'AJs': 100, 'ATs': 100, 'A9s': 100, 'A8s': 100, 'A7s': 100, 'A6s': 100, 'A5s': 100, 'A4s': 100, 'A3s': 100, 'A2s': 100,
      'KQs': 100, 'KJs': 100, 'KTs': 100, 'K9s': 100, 'K8s': 100, 'K7s': 100, 'K6s': 100, 'K5s': 100,
      'QJs': 100, 'QTs': 100, 'Q9s': 100, 'Q8s': 100, 'Q7s': 100,
      'JTs': 100, 'J9s': 100, 'J8s': 100, 'T9s': 100, '98s': 100, '87s': 100, '76s': 100,
      'AKo': 100, 'AQo': 100, 'AJo': 100, 'ATo': 100, 'A9o': 100, 'A8o': 100, 'KQo': 100, 'KJo': 100, 'KTo': 100, 'K9o': 100, 'QJo': 100, 'QTo': 100, 'JTo': 100
    }
  }
};
