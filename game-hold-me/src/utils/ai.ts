import type { Card, GameStage, Player, PlayerAction } from '../types/poker';
import { evaluateHand } from './evaluator';

export interface AIDecision {
  action: PlayerAction;
  amount: number;
}

// Evaluate preflop card strength (Chen Formula approximation or tier rank)
function getPreflopStrength(c1?: Card, c2?: Card): number {
  if (!c1 || !c2 || typeof c1.rank !== 'number' || typeof c2.rank !== 'number') {
    return 0;
  }
  const highRank = Math.max(c1.rank, c2.rank);
  const lowRank = Math.min(c1.rank, c2.rank);
  const isPair = c1.rank === c2.rank;
  const isSuited = c1.suit === c2.suit;
  const gap = highRank - lowRank;

  let score = 0;
  if (isPair) {
    score = highRank * 2 + 20; // 22 -> 24, AA -> 48
  } else {
    score = highRank + (isSuited ? 4 : 0);
    if (gap === 1) score += 3; // Connectors
    else if (gap === 2) score += 2;
    else if (gap === 3) score += 1;
    else if (gap > 4) score -= 3;
  }
  return score; // Range approx 5 to 48
}

export function decideAIAction(
  player: Player,
  communityCards: Card[],
  currentCallAmount: number, // Chips needed to call: maxBet - player.currentBet
  currentHighestBet: number,
  potSize: number,
  stage: GameStage,
  bigBlind: number
): AIDecision {
  if (!player || player.hasFolded) {
    return { action: 'check', amount: 0 };
  }

  const personality = player.personality || '大鱼';
  const callNeeded = currentCallAmount;
  const effectiveChips = player.chips;

  // If no chips to bet, must check/fold/allin
  if (effectiveChips <= 0) {
    return { action: 'check', amount: 0 };
  }

  // Pre-flop logic
  if (stage === 'preflop') {
    const c1 = player.cards?.[0];
    const c2 = player.cards?.[1];
    if (!c1 || !c2) {
      return { action: 'check', amount: 0 };
    }
    const strength = getPreflopStrength(c1, c2);

    switch (personality) {
      case '非要看': {
        // Must see 3 flop cards before considering folding!
        // Calls unless callNeeded is more than 60% of his entire chip stack with garbage
        if (callNeeded === 0) {
          return { action: 'check', amount: 0 };
        }
        if (callNeeded >= effectiveChips * 0.7 && strength < 15) {
          return { action: 'fold', amount: 0 };
        }
        if (callNeeded >= effectiveChips) {
          return { action: 'allin', amount: effectiveChips };
        }
        return { action: 'call', amount: callNeeded };
      }

      case '激进哥': {
        // Aggressive: high raise frequency, loves 3-betting
        if (callNeeded === 0) {
          // Open raise 60% of the time
          if (Math.random() < 0.65 || strength > 20) {
            const raiseSize = Math.min(effectiveChips, Math.max(bigBlind * 3, Math.floor(potSize * 0.75)));
            return raiseSize >= effectiveChips
              ? { action: 'allin', amount: effectiveChips }
              : { action: 'raise', amount: raiseSize };
          }
          return { action: 'check', amount: 0 };
        }

        // Facing a bet:
        if (strength > 32 || (strength > 24 && Math.random() < 0.5)) {
          // Strong or 3-bet bluff: Raise
          const raiseSize = Math.min(
            effectiveChips,
            callNeeded + Math.max(bigBlind * 2, Math.floor(potSize * 0.75))
          );
          if (raiseSize >= effectiveChips) {
            return { action: 'allin', amount: effectiveChips };
          }
          return { action: 'raise', amount: raiseSize };
        }

        if (callNeeded <= bigBlind * 4 || strength > 18 || Math.random() < 0.4) {
          if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
          return { action: 'call', amount: callNeeded };
        }

        return { action: 'fold', amount: 0 };
      }

      case '紧紧哥': {
        // Tight: only plays top 18-20% hands
        // AA-77, AK, AQ, AJ, KQ, KJs, QJs
        const isPremium = strength >= 28;
        const isPlayable = strength >= 22;

        if (callNeeded === 0) {
          if (isPremium) {
            const raiseSize = Math.min(effectiveChips, bigBlind * 3);
            return { action: 'raise', amount: raiseSize };
          }
          if (isPlayable) {
            return { action: 'check', amount: 0 };
          }
          return { action: 'check', amount: 0 };
        }

        if (isPremium) {
          // Re-raise with premium
          if (Math.random() < 0.7) {
            const raiseSize = Math.min(effectiveChips, callNeeded + bigBlind * 3);
            if (raiseSize >= effectiveChips) return { action: 'allin', amount: effectiveChips };
            return { action: 'raise', amount: raiseSize };
          }
          if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
          return { action: 'call', amount: callNeeded };
        }

        if (isPlayable && callNeeded <= bigBlind * 2.5) {
          return { action: 'call', amount: callNeeded };
        }

        return { action: 'fold', amount: 0 };
      }

      case '大鱼':
      default: {
        // Fish: calls almost everything small, rarely raises
        if (callNeeded === 0) {
          if (Math.random() < 0.15) {
            const minRaise = Math.min(effectiveChips, bigBlind * 2);
            return { action: 'raise', amount: minRaise };
          }
          return { action: 'check', amount: 0 };
        }

        // Call if small or moderate bet
        if (callNeeded <= bigBlind * 4 || Math.random() < 0.6) {
          if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
          return { action: 'call', amount: callNeeded };
        }

        return { action: 'fold', amount: 0 };
      }
    }
  }

  // Post-flop logic (Flop, Turn, River)
  if (!player.cards || player.cards.length < 2) {
    return { action: 'check', amount: 0 };
  }
  const fullHand = [...player.cards, ...communityCards];
  const handEval = evaluateHand(fullHand);
  const handScore = handEval.score;

  // Hand tiers:
  // 1e10 = High Card
  // 2e10 = One Pair
  // 3e10 = Two Pair
  // 4e10 = Trips
  // 5e10+ = Straight or better
  const isMonster = handScore >= 4 * 1e10; // Trips, Straight, Flush, Full House+
  const isGood = handScore >= 2.5 * 1e10;  // High Two Pair or Top Pair with good kicker
  const isMade = handScore >= 2 * 1e10;    // Any One Pair

  switch (personality) {
    case '激进哥': {
      // Aggressive: C-bets, bets for value and bluffs
      if (callNeeded === 0) {
        // Bet 70% of the time, whether has hand or bluffing
        if (isMade || Math.random() < 0.5) {
          const betAmount = Math.min(
            effectiveChips,
            Math.max(bigBlind, Math.floor(potSize * (0.5 + Math.random() * 0.4)))
          );
          if (betAmount >= effectiveChips) return { action: 'allin', amount: effectiveChips };
          return { action: 'bet', amount: betAmount };
        }
        return { action: 'check', amount: 0 };
      }

      // Facing a bet:
      if (isMonster) {
        // Re-raise or all-in
        const raiseAmount = Math.min(effectiveChips, callNeeded + Math.floor(potSize * 0.8));
        if (raiseAmount >= effectiveChips || Math.random() < 0.4) {
          return { action: 'allin', amount: effectiveChips };
        }
        return { action: 'raise', amount: raiseAmount };
      }

      if (isGood || (isMade && callNeeded <= potSize * 0.6) || Math.random() < 0.3) {
        if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
        return { action: 'call', amount: callNeeded };
      }

      return { action: 'fold', amount: 0 };
    }

    case '非要看': {
      // Flop: now that he saw 3 cards, he evaluates!
      if (stage === 'flop') {
        if (callNeeded === 0) {
          if (isMade && Math.random() < 0.4) {
            const betAmount = Math.min(effectiveChips, Math.floor(potSize * 0.5));
            return { action: 'bet', amount: betAmount };
          }
          return { action: 'check', amount: 0 };
        }
        // If he made at least a pair or reasonable draw, he continues
        if (isMade || callNeeded <= bigBlind * 3 || Math.random() < 0.5) {
          if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
          return { action: 'call', amount: callNeeded };
        }
        return { action: 'fold', amount: 0 };
      }

      // Turn & River
      if (callNeeded === 0) {
        if (isMonster && Math.random() < 0.6) {
          const betAmount = Math.min(effectiveChips, Math.floor(potSize * 0.6));
          return { action: 'bet', amount: betAmount };
        }
        return { action: 'check', amount: 0 };
      }

      if (isGood || (isMade && callNeeded <= potSize * 0.4)) {
        if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
        return { action: 'call', amount: callNeeded };
      }

      return { action: 'fold', amount: 0 };
    }

    case '紧紧哥': {
      // Tight: only stays in if has good hand or nuts
      if (callNeeded === 0) {
        if (isMonster) {
          const betAmount = Math.min(effectiveChips, Math.floor(potSize * 0.7));
          return { action: 'bet', amount: betAmount };
        }
        if (isGood) {
          const betAmount = Math.min(effectiveChips, Math.floor(potSize * 0.5));
          return { action: 'bet', amount: betAmount };
        }
        return { action: 'check', amount: 0 };
      }

      // Facing bet:
      if (isMonster) {
        if (Math.random() < 0.6) {
          const raiseAmount = Math.min(effectiveChips, callNeeded + Math.floor(potSize * 0.75));
          if (raiseAmount >= effectiveChips) return { action: 'allin', amount: effectiveChips };
          return { action: 'raise', amount: raiseAmount };
        }
        if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
        return { action: 'call', amount: callNeeded };
      }

      if (isGood && callNeeded <= potSize * 0.75) {
        if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
        return { action: 'call', amount: callNeeded };
      }

      if (isMade && callNeeded <= bigBlind * 2) {
        return { action: 'call', amount: callNeeded };
      }

      return { action: 'fold', amount: 0 };
    }

    case '大鱼':
    default: {
      // Fish: passive caller, unpredictable
      if (callNeeded === 0) {
        if (Math.random() < 0.2) {
          const smallBet = Math.min(effectiveChips, Math.max(bigBlind, Math.floor(potSize * 0.25)));
          return { action: 'bet', amount: smallBet };
        }
        return { action: 'check', amount: 0 };
      }

      if (isMade || callNeeded <= potSize * 0.5 || Math.random() < 0.45) {
        if (callNeeded >= effectiveChips) return { action: 'allin', amount: effectiveChips };
        return { action: 'call', amount: callNeeded };
      }

      return { action: 'fold', amount: 0 };
    }
  }
}
