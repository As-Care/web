export type Suit = "♠" | "♥" | "♣" | "♦";
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // 11=J, 12=Q, 13=K, 14=A

export interface Card {
  suit: Suit;
  rank: Rank;
}

export type HandRankCategory =
  | "ROYAL_FLUSH"
  | "STRAIGHT_FLUSH"
  | "FOUR_OF_A_KIND"
  | "FULL_HOUSE"
  | "FLUSH"
  | "STRAIGHT"
  | "THREE_OF_A_KIND"
  | "TWO_PAIR"
  | "ONE_PAIR"
  | "HIGH_CARD";

export interface HandEvaluation {
  category: HandRankCategory;
  score: number; // For fast comparison
  rankName: string; // e.g. "皇家同花顺", "葫芦", "顺子", "一对"
  best5: Card[]; // The 5 cards that make the best hand
  description: string; // e.g. "葫芦 (A和K)"
}

export type BotPersonality =
  | "激进哥" // Aggressive: raises often, bluffs, pushes big bets
  | "非要看" // Calling Station: must see flop (3 cards) before considering fold
  | "紧紧哥" // Tight-Aggressive: plays only top tier hands, raises hard with nuts
  | "大鱼" // Fish/Rookie: calls randomly, inconsistent bets, passive
  | "激进姐";

export type PlayerAction =
  | "fold"
  | "check"
  | "call"
  | "bet"
  | "raise"
  | "allin";

export type GameStage =
  | "idle"
  | "preflop"
  | "flop"
  | "turn"
  | "river"
  | "showdown"
  | "ended";

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHuman: boolean;
  personality?: BotPersonality;
  chips: number;
  currentBet: number; // Bet in current betting round
  totalHandBet: number; // Total chips put in current hand
  cards: Card[];
  hasFolded: boolean;
  isAllIn: boolean;
  hasActed: boolean;
  showCards: boolean;
  evaluation?: HandEvaluation;
  winOdds?: number; // 0-100%
  lastAction?: {
    type: PlayerAction;
    amount?: number;
    text: string;
  };
  seatIndex: number;
  totalBuyIn: number; // Cumulative buy-in amount for leaderboard
  netProfit: number; // Cumulative profit/loss
  extensionsUsed: number; // Max 1 per hand
}

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export interface HandPlayerRecord {
  id: string;
  name: string;
  avatar: string;
  isHuman: boolean;
  positionName: string; // '庄家 (D)', '小盲 (SB)', '大盲 (BB)', or ''
  cards: Card[];
  handRankName: string;
  actionText: string;
  profit: number; // Positive = win, negative = loss
  isWinner: boolean;
  folded: boolean;
}

export interface HandHistory {
  id: string;
  handNumber: number;
  timestamp: string;
  blinds: { small: number; big: number };
  totalPot: number;
  communityCards: Card[];
  players: HandPlayerRecord[];
  winnerNames: string[];
}

export interface TableConfig {
  playerCount: number; // 2 to 12
  smallBlind: number; // 20 to 200
  bigBlind: number; // 40 to 400
  turnDuration: number; // 20s
  timeExtension: number; // 10s
  theme: "burgundy" | "emerald" | "sapphire" | "midnight";
}
