import type { Card, HandEvaluation, HandRankCategory, Rank, Suit } from '../types/poker';

export const SUITS: Suit[] = ['♠', '♥', '♣', '♦'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const RANK_NAMES: Record<Rank, string> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export const CHINESE_RANK_NAMES: Record<HandRankCategory, string> = {
  ROYAL_FLUSH: '皇家同花顺',
  STRAIGHT_FLUSH: '同花顺',
  FOUR_OF_A_KIND: '四条',
  FULL_HOUSE: '葫芦',
  FLUSH: '同花',
  STRAIGHT: '顺子',
  THREE_OF_A_KIND: '三条',
  TWO_PAIR: '两对',
  ONE_PAIR: '一对',
  HIGH_CARD: '高牌',
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate all combinations of k elements from array
function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const head = arr[0];
  const tail = arr.slice(1);
  const withHead = combinations(tail, k - 1).map((c) => [head, ...c]);
  const withoutHead = combinations(tail, k);
  return [...withHead, ...withoutHead];
}

// Evaluate exactly 5 cards
function evaluate5Cards(cards: Card[]): HandEvaluation {
  // Sort descending by rank
  const sorted = [...cards].sort((a, b) => b.rank - a.rank);

  // Group by rank
  const rankCounts: Record<number, number> = {};
  for (const c of sorted) {
    rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
  }

  // Group by suit
  const suitCounts: Record<string, Card[]> = {};
  for (const c of sorted) {
    if (!suitCounts[c.suit]) suitCounts[c.suit] = [];
    suitCounts[c.suit].push(c);
  }

  const isFlush = Object.values(suitCounts).some((group) => group.length === 5);

  // Straight check
  const uniqueRanks = Array.from(new Set(sorted.map((c) => c.rank))).sort((a, b) => b - a);
  let isStraight = false;
  let straightHigh = 0;

  if (uniqueRanks.length === 5) {
    if (uniqueRanks[0] - uniqueRanks[4] === 4) {
      isStraight = true;
      straightHigh = uniqueRanks[0];
    } else if (
      // Wheel straight: A-2-3-4-5
      uniqueRanks[0] === 14 &&
      uniqueRanks[1] === 5 &&
      uniqueRanks[2] === 4 &&
      uniqueRanks[3] === 3 &&
      uniqueRanks[4] === 2
    ) {
      isStraight = true;
      straightHigh = 5;
    }
  }

  // Straight flush / Royal flush
  if (isFlush && isStraight) {
    if (straightHigh === 14) {
      return {
        category: 'ROYAL_FLUSH',
        score: 10 * 1e10 + straightHigh,
        rankName: CHINESE_RANK_NAMES.ROYAL_FLUSH,
        best5: sorted,
        description: '皇家同花顺',
      };
    }
    return {
      category: 'STRAIGHT_FLUSH',
      score: 9 * 1e10 + straightHigh,
      rankName: CHINESE_RANK_NAMES.STRAIGHT_FLUSH,
      best5: sorted,
      description: `同花顺 (${RANK_NAMES[straightHigh as Rank]}高)`,
    };
  }

  // Four of a kind
  const counts = Object.entries(rankCounts)
    .map(([r, count]) => ({ rank: Number(r), count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.rank - a.rank));

  if (counts[0].count === 4) {
    const quadRank = counts[0].rank;
    const kicker = counts[1].rank;
    return {
      category: 'FOUR_OF_A_KIND',
      score: 8 * 1e10 + quadRank * 1e4 + kicker,
      rankName: CHINESE_RANK_NAMES.FOUR_OF_A_KIND,
      best5: sorted,
      description: `四条 (${RANK_NAMES[quadRank as Rank]})`,
    };
  }

  // Full house
  if (counts[0].count === 3 && counts[1].count === 2) {
    const tripRank = counts[0].rank;
    const pairRank = counts[1].rank;
    return {
      category: 'FULL_HOUSE',
      score: 7 * 1e10 + tripRank * 1e4 + pairRank,
      rankName: CHINESE_RANK_NAMES.FULL_HOUSE,
      best5: sorted,
      description: `葫芦 (${RANK_NAMES[tripRank as Rank]}带${RANK_NAMES[pairRank as Rank]})`,
    };
  }

  // Flush
  if (isFlush) {
    let score = 6 * 1e10;
    sorted.forEach((c, idx) => {
      score += c.rank * Math.pow(15, 4 - idx);
    });
    return {
      category: 'FLUSH',
      score,
      rankName: CHINESE_RANK_NAMES.FLUSH,
      best5: sorted,
      description: `同花 (${RANK_NAMES[sorted[0].rank as Rank]}高)`,
    };
  }

  // Straight
  if (isStraight) {
    return {
      category: 'STRAIGHT',
      score: 5 * 1e10 + straightHigh,
      rankName: CHINESE_RANK_NAMES.STRAIGHT,
      best5: sorted,
      description: `顺子 (${RANK_NAMES[straightHigh as Rank]}高)`,
    };
  }

  // Three of a kind
  if (counts[0].count === 3) {
    const tripRank = counts[0].rank;
    const kickers = counts.slice(1).map((c) => c.rank);
    let score = 4 * 1e10 + tripRank * 1e6;
    kickers.forEach((k, idx) => {
      score += k * Math.pow(15, 2 - idx);
    });
    return {
      category: 'THREE_OF_A_KIND',
      score,
      rankName: CHINESE_RANK_NAMES.THREE_OF_A_KIND,
      best5: sorted,
      description: `三条 (${RANK_NAMES[tripRank as Rank]})`,
    };
  }

  // Two pair
  if (counts[0].count === 2 && counts[1].count === 2) {
    const highPair = Math.max(counts[0].rank, counts[1].rank);
    const lowPair = Math.min(counts[0].rank, counts[1].rank);
    const kicker = counts[2].rank;
    const score = 3 * 1e10 + highPair * 1e6 + lowPair * 1e3 + kicker;
    return {
      category: 'TWO_PAIR',
      score,
      rankName: CHINESE_RANK_NAMES.TWO_PAIR,
      best5: sorted,
      description: `两对 (${RANK_NAMES[highPair as Rank]}和${RANK_NAMES[lowPair as Rank]})`,
    };
  }

  // One pair
  if (counts[0].count === 2) {
    const pairRank = counts[0].rank;
    const kickers = counts.slice(1).map((c) => c.rank);
    let score = 2 * 1e10 + pairRank * 1e6;
    kickers.forEach((k, idx) => {
      score += k * Math.pow(15, 3 - idx);
    });
    return {
      category: 'ONE_PAIR',
      score,
      rankName: CHINESE_RANK_NAMES.ONE_PAIR,
      best5: sorted,
      description: `一对 (${RANK_NAMES[pairRank as Rank]})`,
    };
  }

  // High card
  let score = 1 * 1e10;
  sorted.forEach((c, idx) => {
    score += c.rank * Math.pow(15, 4 - idx);
  });
  return {
    category: 'HIGH_CARD',
    score,
    rankName: CHINESE_RANK_NAMES.HIGH_CARD,
    best5: sorted,
    description: `高牌 (${RANK_NAMES[sorted[0].rank as Rank]}高)`,
  };
}

// Evaluate 5, 6, or 7 cards and return the best 5-card evaluation
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    // If fewer than 5 cards (e.g. hole cards only), return temporary evaluation
    if (cards.length === 2) {
      const sorted = [...cards].sort((a, b) => b.rank - a.rank);
      if (sorted[0].rank === sorted[1].rank) {
        return {
          category: 'ONE_PAIR',
          score: 2 * 1e10 + sorted[0].rank * 1e6,
          rankName: '对子',
          best5: sorted,
          description: `底牌对${RANK_NAMES[sorted[0].rank as Rank]}`,
        };
      }
      return {
        category: 'HIGH_CARD',
        score: 1 * 1e10 + sorted[0].rank * 1e6 + sorted[1].rank,
        rankName: '高牌',
        best5: sorted,
        description: `${RANK_NAMES[sorted[0].rank as Rank]}${RANK_NAMES[sorted[1].rank as Rank]}高牌`,
      };
    }
    return {
      category: 'HIGH_CARD',
      score: 0,
      rankName: '未开牌',
      best5: cards,
      description: '',
    };
  }

  // If 5 cards, evaluate directly
  if (cards.length === 5) {
    return evaluate5Cards(cards);
  }

  // Pick best 5 from 6 or 7 cards
  const allCombos = combinations(cards, 5);
  let bestEval: HandEvaluation | null = null;

  for (const combo of allCombos) {
    const currentEval = evaluate5Cards(combo);
    if (!bestEval || currentEval.score > bestEval.score) {
      bestEval = currentEval;
    }
  }

  return bestEval!;
}

// Fast Monte Carlo calculation of win probabilities for players who haven't folded
export function calculateWinOdds(
  activePlayers: { id: string; cards: Card[] }[],
  communityCards: Card[],
  simulations = 400
): Record<string, number> {
  if (activePlayers.length === 0) return {};
  if (activePlayers.length === 1) {
    return { [activePlayers[0].id]: 100 };
  }

  // If full board (5 community cards), determine exact winner (100% or split)
  if (communityCards.length === 5) {
    const evals = activePlayers.map((p) => ({
      id: p.id,
      eval: evaluateHand([...p.cards, ...communityCards]),
    }));
    const maxScore = Math.max(...evals.map((e) => e.eval.score));
    const winners = evals.filter((e) => e.eval.score === maxScore);
    const winRate = Math.round(100 / winners.length);

    const result: Record<string, number> = {};
    for (const p of activePlayers) {
      result[p.id] = winners.some((w) => w.id === p.id) ? winRate : 0;
    }
    return result;
  }

  // Remaining cards in deck
  const usedCards = new Set<string>();
  communityCards.forEach((c) => usedCards.add(`${c.suit}-${c.rank}`));
  activePlayers.forEach((p) => p.cards.forEach((c) => usedCards.add(`${c.suit}-${c.rank}`)));

  const remainingDeck: Card[] = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      if (!usedCards.has(`${s}-${r}`)) {
        remainingDeck.push({ suit: s, rank: r });
      }
    }
  }

  const cardsNeeded = 5 - communityCards.length;
  const wins: Record<string, number> = {};
  activePlayers.forEach((p) => (wins[p.id] = 0));

  for (let s = 0; s < simulations; s++) {
    // Pick needed random cards
    const simDeck = [...remainingDeck];
    const drawn: Card[] = [];
    for (let c = 0; c < cardsNeeded; c++) {
      const idx = Math.floor(Math.random() * (simDeck.length - c));
      drawn.push(simDeck[idx]);
      [simDeck[idx], simDeck[simDeck.length - 1 - c]] = [simDeck[simDeck.length - 1 - c], simDeck[idx]];
    }

    const fullBoard = [...communityCards, ...drawn];
    let bestScore = -1;
    let simWinners: string[] = [];

    for (const p of activePlayers) {
      const handEval = evaluateHand([...p.cards, ...fullBoard]);
      if (handEval.score > bestScore) {
        bestScore = handEval.score;
        simWinners = [p.id];
      } else if (handEval.score === bestScore) {
        simWinners.push(p.id);
      }
    }

    for (const wId of simWinners) {
      wins[wId] += 1 / simWinners.length;
    }
  }

  const odds: Record<string, number> = {};
  for (const p of activePlayers) {
    odds[p.id] = Math.round((wins[p.id] / simulations) * 100);
  }
  return odds;
}
