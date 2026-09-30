import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import type {
  Card,
  GameStage,
  HandHistory,
  HandPlayerRecord,
  Player,
  PlayerAction,
  Pot,
  TableConfig,
} from '../types/poker';
import { decideAIAction } from '../utils/ai';
import { getFallbackAvatar, PRESET_BOTS } from '../utils/avatars';
import { calculateWinOdds, createDeck, evaluateHand, shuffleDeck } from '../utils/evaluator';
import { sound } from '../utils/sound';

export function usePokerGame() {
  // Table Configuration
  const config = reactive<TableConfig>({
    playerCount: 8, // Default 8, max 12
    smallBlind: 20,
    bigBlind: 40,
    turnDuration: 20,
    timeExtension: 10,
    theme: 'emerald',
  });

  // Table State
  const players = ref<Player[]>([]);
  const communityCards = ref<Card[]>([]);
  const deck = ref<Card[]>([]);
  const isDealing = ref<boolean>(false);
  const stage = ref<GameStage>('idle');
  const dealerIndex = ref<number>(0);
  const activePlayerIndex = ref<number>(-1);
  const currentHighestBet = ref<number>(0);
  const minRaise = ref<number>(40);
  const totalPot = ref<number>(0);
  const pots = ref<Pot[]>([]);
  const handNumber = ref<number>(1);
  const gameStartTime = ref<number>(Date.now());
  const gameDurationSeconds = ref<number>(0);
  const history = ref<HandHistory[]>([]);

  // Turn timer state
  const turnTimeRemaining = ref<number>(20);
  const turnTotalTime = ref<number>(20);
  let turnTimerId: ReturnType<typeof setInterval> | null = null;
  let timerStartTime = 0;
  let timerTotalMs = 0;
  let gameDurationTimerId: ReturnType<typeof setInterval> | null = null;

  // Hand Cancellation & Async Timer Management
  let currentHandToken = 0;
  let aiThinkTimerId: ReturnType<typeof setTimeout> | null = null;
  let autoActionTimerId: ReturnType<typeof setTimeout> | null = null;
  let runoutTimerId: ReturnType<typeof setTimeout> | null = null;
  let advanceStageTimerId: ReturnType<typeof setTimeout> | null = null;

  function clearAllPendingTimers() {
    stopTurnTimer();
    if (aiThinkTimerId) {
      clearTimeout(aiThinkTimerId);
      aiThinkTimerId = null;
    }
    if (autoActionTimerId) {
      clearTimeout(autoActionTimerId);
      autoActionTimerId = null;
    }
    if (runoutTimerId) {
      clearTimeout(runoutTimerId);
      runoutTimerId = null;
    }
    if (advanceStageTimerId) {
      clearTimeout(advanceStageTimerId);
      advanceStageTimerId = null;
    }
  }

  // Auto-action states for Hero
  const autoCheckOrFold = ref<boolean>(false);
  const autoCheck = ref<boolean>(false);
  const autoCallAny = ref<boolean>(false);

  // All-in runout state (跑马状态: 留下的人都没有后手)
  const isAllInRunout = ref<boolean>(false);

  // Showdown & Result State
  const showdownWinners = ref<{ id: string; name: string; amount: number; desc: string }[]>([]);
  const isShowdownActive = ref<boolean>(false);

  // Stats
  const totalVolume = ref<number>(0);

  // Hero is always player at index 0
  const hero = computed<Player | undefined>(() => players.value.find((p) => p.isHuman));
  const isHeroTurn = computed<boolean>(() => {
    if (stage.value === 'idle' || stage.value === 'ended') return false;
    if (activePlayerIndex.value < 0 || activePlayerIndex.value >= players.value.length) return false;
    return players.value[activePlayerIndex.value]?.isHuman ?? false;
  });

  // Initialize players
  function initPlayers() {
    const list: Player[] = [];

    // Hero player (You)
    list.push({
      id: 'hero',
      name: 'You',
      avatar: getFallbackAvatar('You', 7),
      isHuman: true,
      chips: 1200, // Initial chips: 1200 as requested
      currentBet: 0,
      totalHandBet: 0,
      cards: [],
      hasFolded: false,
      isAllIn: false,
      hasActed: false,
      showCards: true,
      seatIndex: 0,
      totalBuyIn: 1200,
      netProfit: 0,
      extensionsUsed: 0,
    });

    // Add Bots up to config.playerCount
    for (let i = 1; i < config.playerCount; i++) {
      const preset = PRESET_BOTS[(i - 1) % PRESET_BOTS.length];
      list.push({
        id: `bot-${i}`,
        name: preset.name,
        avatar: preset.avatar,
        isHuman: false,
        personality: preset.personality,
        chips: 1200 + Math.floor(Math.random() * 5) * 500, // Realistic chip stacks
        currentBet: 0,
        totalHandBet: 0,
        cards: [],
        hasFolded: false,
        isAllIn: false,
        hasActed: false,
        showCards: false,
        seatIndex: i,
        totalBuyIn: 1200,
        netProfit: 0,
        extensionsUsed: 0,
      });
    }

    players.value = list;
  }

  // Apply custom settings (playerCount, blinds, bot names & personalities) and start game
  function applyGameSettings(data: {
    playerCount: number;
    smallBlind: number;
    bigBlind: number;
    theme: 'burgundy' | 'emerald' | 'midnight';
    bots: { name: string; personality: any }[];
  }) {
    config.playerCount = Math.max(2, Math.min(12, data.playerCount));
    config.smallBlind = data.smallBlind;
    config.bigBlind = data.bigBlind;
    config.theme = data.theme;

    const list: Player[] = [];
    const currentHeroChips = hero.value?.chips ?? 1200;
    const currentHeroBuyIn = hero.value?.totalBuyIn ?? 1200;

    // 1. Hero (You)
    list.push({
      id: 'hero',
      name: 'You',
      avatar: getFallbackAvatar('You', 7),
      isHuman: true,
      chips: currentHeroChips,
      currentBet: 0,
      totalHandBet: 0,
      cards: [],
      hasFolded: false,
      isAllIn: false,
      hasActed: false,
      showCards: true,
      seatIndex: 0,
      totalBuyIn: currentHeroBuyIn,
      netProfit: 0,
      extensionsUsed: 0,
    });

    // 2. Bots (Default nicknames: 激进哥, 非要看, 紧紧哥, 大鱼...)
    for (let i = 1; i < config.playerCount; i++) {
      const preset = PRESET_BOTS[(i - 1) % PRESET_BOTS.length];
      const botConfig = data.bots[i - 1] || preset;
      let name = botConfig.name?.trim() || preset.name;
      if (name.startsWith('人机')) {
        name = preset.name;
      }
      list.push({
        id: `bot-${i}`,
        name,
        avatar: getFallbackAvatar(name, i),
        isHuman: false,
        personality: botConfig.personality || preset.personality,
        chips: 1200,
        currentBet: 0,
        totalHandBet: 0,
        cards: [],
        hasFolded: false,
        isAllIn: false,
        hasActed: false,
        showCards: false,
        seatIndex: i,
        totalBuyIn: 1200,
        netProfit: 0,
        extensionsUsed: 0,
      });
    }

    players.value = list;
    startHand();
  }

  // Update player count dynamically from settings
  function updatePlayerCount(count: number) {
    if (count < 2) count = 2;
    if (count > 12) count = 12;
    config.playerCount = count;

    if (players.value.length < count) {
      // Add missing players
      for (let i = players.value.length; i < count; i++) {
        const preset = PRESET_BOTS[(i - 1) % PRESET_BOTS.length];
        players.value.push({
          id: `bot-${i}`,
          name: preset.name,
          avatar: preset.avatar,
          isHuman: false,
          personality: preset.personality,
          chips: 1200,
          currentBet: 0,
          totalHandBet: 0,
          cards: [],
          hasFolded: false,
          isAllIn: false,
          hasActed: false,
          showCards: false,
          seatIndex: i,
          totalBuyIn: 1200,
          netProfit: 0,
          extensionsUsed: 0,
        });
      }
    } else if (players.value.length > count) {
      // Slice off excess
      players.value = players.value.slice(0, count);
    }
  }

  // Wallet Buy-in:
  // Rule: Initial 1200, max 6000 per buy-in, unlimited times,
  // BUT if current chips > 6000, buy-in is NOT allowed!
  function buyInChips(amount: number): { success: boolean; message: string } {
    if (!hero.value) return { success: false, message: '未找到玩家' };
    if (hero.value.chips > 6000) {
      return { success: false, message: '当前筹码大于6000，不可带入！' };
    }
    if (amount <= 0 || amount > 6000) {
      return { success: false, message: '单次带入筹码必须在 1 ~ 6000 之间' };
    }

    hero.value.chips += amount;
    hero.value.totalBuyIn += amount;
    sound.playChips();
    return { success: true, message: `成功带入 ${amount} 筹码！` };
  }

  // Start a new hand
  async function startHand() {
    clearAllPendingTimers();
    const handToken = ++currentHandToken;
    activePlayerIndex.value = -1;
    isDealing.value = true;
    isShowdownActive.value = false;
    isAllInRunout.value = false;
    showdownWinners.value = [];
    communityCards.value = [];
    totalPot.value = 0;
    pots.value = [];
    currentHighestBet.value = 0;
    autoCheckOrFold.value = false;
    autoCheck.value = false;
    autoCallAny.value = false;

    // Filter out broke players or auto re-buy bots
    players.value.forEach((p) => {
      if (p.chips < config.bigBlind) {
        if (p.isHuman) {
          p.chips += 1200;
          p.totalBuyIn += 1200;
        } else {
          p.chips += 2000;
          p.totalBuyIn += 2000;
        }
      }
      p.currentBet = 0;
      p.totalHandBet = 0;
      p.cards = [];
      p.hasFolded = false;
      p.isAllIn = false;
      p.hasActed = false;
      p.showCards = p.isHuman;
      p.evaluation = undefined;
      p.winOdds = undefined;
      p.lastAction = undefined;
      p.extensionsUsed = 0;
    });

    // Move dealer button
    dealerIndex.value = (dealerIndex.value + 1) % players.value.length;

    // Post Blinds
    const sbIndex = (dealerIndex.value + 1) % players.value.length;
    const bbIndex = (dealerIndex.value + 2) % players.value.length;

    postBlind(sbIndex, config.smallBlind, '小盲 (SB)');
    postBlind(bbIndex, config.bigBlind, '大盲 (BB)');

    currentHighestBet.value = config.bigBlind;
    minRaise.value = config.bigBlind;
    stage.value = 'preflop';

    // Create & shuffle deck
    deck.value = shuffleDeck(createDeck());

    // Calculate dynamic deal pace (approx 45-75ms per card)
    const playerCount = players.value.length;
    const dealDelay = Math.max(45, Math.min(75, Math.floor(520 / playerCount)));

    // Deal 2 hole cards around table starting from Small Blind (clockwise)
    for (let c = 0; c < 2; c++) {
      for (let offset = 0; offset < playerCount; offset++) {
        if (currentHandToken !== handToken) return;
        const playerIdx = (sbIndex + offset) % playerCount;
        const card = deck.value.pop()!;
        players.value[playerIdx].cards.push(card);
        sound.playDeal();
        await new Promise((r) => setTimeout(r, dealDelay));
        if (currentHandToken !== handToken) return;
      }
    }

    if (currentHandToken !== handToken) return;

    // Update hero preflop evaluation
    updateEvaluations();
    isDealing.value = false;

    // Action starts UTG (player after Big Blind)
    const utgIndex = (bbIndex + 1) % players.value.length;
    nextTurn(utgIndex);
  }

  function postBlind(playerIdx: number, blindAmount: number, label: string) {
    const player = players.value[playerIdx];
    const actualAmount = Math.min(player.chips, blindAmount);
    player.chips -= actualAmount;
    player.currentBet = actualAmount;
    player.totalHandBet = actualAmount;
    totalPot.value += actualAmount;
    if (player.chips === 0) {
      player.isAllIn = true;
    }
    player.lastAction = {
      type: 'bet',
      amount: actualAmount,
      text: `${label} ${actualAmount}`,
    };
  }

  // Turn timer management (ultra-smooth high-frequency countdown at 30ms intervals)
  function startTurnTimer(player: Player) {
    stopTurnTimer();
    const duration = config.turnDuration;
    turnTotalTime.value = duration;
    turnTimeRemaining.value = duration;

    timerStartTime = performance.now();
    timerTotalMs = duration * 1000;
    let lastTickSecond = duration;

    turnTimerId = setInterval(() => {
      const elapsed = performance.now() - timerStartTime;
      const remainingMs = Math.max(0, timerTotalMs - elapsed);
      turnTimeRemaining.value = remainingMs / 1000;

      const currentSecond = Math.ceil(remainingMs / 1000);
      if (currentSecond !== lastTickSecond) {
        lastTickSecond = currentSecond;
        if (currentSecond <= 4 && currentSecond > 0 && player.isHuman) {
          sound.playTick();
        }
      }

      if (remainingMs <= 0) {
        stopTurnTimer();
        handleTimeOut(player);
      }
    }, 30);
  }

  function stopTurnTimer() {
    if (turnTimerId) {
      clearInterval(turnTimerId);
      turnTimerId = null;
    }
    if (aiThinkTimerId) {
      clearTimeout(aiThinkTimerId);
      aiThinkTimerId = null;
    }
    if (autoActionTimerId) {
      clearTimeout(autoActionTimerId);
      autoActionTimerId = null;
    }
    turnTimeRemaining.value = 0;
  }

  // Delay / +10s Extension: 1 time extension allowed per hand
  function applyTimeExtension() {
    const player = players.value[activePlayerIndex.value];
    if (!player || !player.isHuman) return false;
    if (player.extensionsUsed >= 1) return false;

    player.extensionsUsed += 1;
    timerTotalMs += config.timeExtension * 1000;
    turnTotalTime.value += config.timeExtension;
    return true;
  }

  function handleTimeOut(player: Player) {
    if (!player) return;
    const callAmount = currentHighestBet.value - player.currentBet;
    if (callAmount === 0) {
      // Free check
      executeAction(player, 'check', 0);
    } else {
      // Fold on timeout
      executeAction(player, 'fold', 0);
    }
  }

  // Check if remaining players have no further actions ("跑马" / all-in runout)
  function checkAndTriggerAllInRunout(): boolean {
    if (stage.value === 'idle' || stage.value === 'ended') {
      isAllInRunout.value = false;
      return false;
    }

    const activeUnfolded = players.value.filter((p) => !p.hasFolded);
    if (activeUnfolded.length < 2) {
      isAllInRunout.value = false;
      return false;
    }

    // Players with chips remaining who can potentially bet
    const playersWithChips = activeUnfolded.filter((p) => !p.isAllIn && p.chips > 0);

    // Check if anyone owes chips to the current highest bet
    const hasUncalledBet = activeUnfolded.some(
      (p) => !p.isAllIn && p.currentBet < currentHighestBet.value
    );

    // If at most 1 player has chips and no uncalled bet remains, no more betting can ever occur
    if (playersWithChips.length <= 1 && !hasUncalledBet) {
      isAllInRunout.value = true;
      // Reveal hole cards for all remaining active players
      activeUnfolded.forEach((p) => {
        p.showCards = true;
      });
      // Recalculate evaluations & win odds
      updateEvaluations();
      return true;
    }

    return false;
  }

  // Advance to next player or next stage
  function nextTurn(targetIndex: number) {
    const handToken = currentHandToken;
    if (currentHandToken !== handToken) return;

    activePlayerIndex.value = targetIndex;
    const player = players.value[targetIndex];
    if (!player) return;

    // Check if betting round is completed
    if (isBettingRoundComplete()) {
      checkAndTriggerAllInRunout();
      advanceStage();
      return;
    }

    // Skip players who folded or are all-in
    if (player.hasFolded || player.isAllIn) {
      const nextIdx = (targetIndex + 1) % players.value.length;
      nextTurn(nextIdx);
      return;
    }

    startTurnTimer(player);

    if (player.isHuman) {
      // Check auto-actions
      const callAmount = currentHighestBet.value - player.currentBet;
      if (autoCheckOrFold.value) {
        autoActionTimerId = setTimeout(() => {
          autoActionTimerId = null;
          if (currentHandToken !== handToken) return;
          if (stage.value === 'ended' || stage.value === 'idle') return;
          if (activePlayerIndex.value !== targetIndex) return;

          if (callAmount === 0) executeAction(player, 'check', 0);
          else executeAction(player, 'fold', 0);
          autoCheckOrFold.value = false;
        }, 300);
        return;
      }
      if (autoCheck.value && callAmount === 0) {
        autoActionTimerId = setTimeout(() => {
          autoActionTimerId = null;
          if (currentHandToken !== handToken) return;
          if (stage.value === 'ended' || stage.value === 'idle') return;
          if (activePlayerIndex.value !== targetIndex) return;

          executeAction(player, 'check', 0);
          autoCheck.value = false;
        }, 300);
        return;
      }
      if (autoCallAny.value) {
        autoActionTimerId = setTimeout(() => {
          autoActionTimerId = null;
          if (currentHandToken !== handToken) return;
          if (stage.value === 'ended' || stage.value === 'idle') return;
          if (activePlayerIndex.value !== targetIndex) return;

          if (callAmount === 0) executeAction(player, 'check', 0);
          else executeAction(player, 'call', callAmount);
          autoCallAny.value = false;
        }, 300);
        return;
      }
    } else {
      // AI decision after realistic delay (1.0 - 2.5s)
      const thinkTime = 1000 + Math.random() * 1400;
      aiThinkTimerId = setTimeout(() => {
        aiThinkTimerId = null;
        if (currentHandToken !== handToken) return;
        if (stage.value === 'ended' || stage.value === 'idle') return;
        if (activePlayerIndex.value !== targetIndex) return;

        const callAmount = currentHighestBet.value - player.currentBet;
        const decision = decideAIAction(
          player,
          communityCards.value,
          callAmount,
          currentHighestBet.value,
          totalPot.value,
          stage.value,
          config.bigBlind
        );
        executeAction(player, decision.action, decision.amount);
      }, thinkTime);
    }
  }

  // Check if betting round is settled
  function isBettingRoundComplete(): boolean {
    const activeUnfolded = players.value.filter((p) => !p.hasFolded);

    // If only 1 player remains, hand is over immediately!
    if (activeUnfolded.length <= 1) {
      return true;
    }

    // Check if all non-folded, non-all-in players have acted and matched the highest bet
    for (const p of activeUnfolded) {
      if (p.isAllIn) continue;
      if (!p.hasActed) return false;
      if (p.currentBet !== currentHighestBet.value) return false;
    }

    return true;
  }

  // Execute Player Action
  function executeAction(player: Player, action: PlayerAction, amount = 0) {
    stopTurnTimer();
    player.hasActed = true;
    const callNeeded = currentHighestBet.value - player.currentBet;

    switch (action) {
      case 'fold': {
        player.hasFolded = true;
        player.lastAction = { type: 'fold', text: '弃牌' };
        sound.playFold();
        if (player.isHuman) {
          autoCheckOrFold.value = false;
          autoCheck.value = false;
          autoCallAny.value = false;
        }
        break;
      }

      case 'check': {
        player.lastAction = { type: 'check', text: '过牌' };
        sound.playCheck();
        break;
      }

      case 'call': {
        const actualCall = Math.min(player.chips, callNeeded);
        player.chips -= actualCall;
        player.currentBet += actualCall;
        player.totalHandBet += actualCall;
        totalPot.value += actualCall;
        if (player.chips === 0) {
          player.isAllIn = true;
          player.lastAction = { type: 'allin', amount: actualCall, text: `All In ${actualCall}` };
          sound.playAllIn();
        } else {
          player.lastAction = { type: 'call', amount: actualCall, text: `跟注 ${actualCall}` };
          sound.playChips();
        }
        break;
      }

      case 'bet':
      case 'raise': {
        const totalToAdd = Math.min(player.chips, amount);
        player.chips -= totalToAdd;
        player.currentBet += totalToAdd;
        player.totalHandBet += totalToAdd;
        totalPot.value += totalToAdd;

        // Min raise increment tracking
        const raiseIncrement = player.currentBet - currentHighestBet.value;
        if (raiseIncrement > minRaise.value) {
          minRaise.value = raiseIncrement;
        }
        currentHighestBet.value = player.currentBet;

        // Reset hasActed for other active players who now need to respond to this raise
        players.value.forEach((p) => {
          if (p.id !== player.id && !p.hasFolded && !p.isAllIn) {
            p.hasActed = false;
          }
        });

        if (player.chips === 0) {
          player.isAllIn = true;
          player.lastAction = { type: 'allin', amount: totalToAdd, text: `All In ${totalToAdd}` };
          sound.playAllIn();
        } else {
          const actionText = action === 'bet' ? `下注 ${totalToAdd}` : `加注至 ${player.currentBet}`;
          player.lastAction = { type: action, amount: totalToAdd, text: actionText };
          sound.playChips();
        }
        break;
      }

      case 'allin': {
        const allInAmount = player.chips;
        player.chips = 0;
        player.currentBet += allInAmount;
        player.totalHandBet += allInAmount;
        totalPot.value += allInAmount;
        player.isAllIn = true;

        if (player.currentBet > currentHighestBet.value) {
          const inc = player.currentBet - currentHighestBet.value;
          if (inc > minRaise.value) minRaise.value = inc;
          currentHighestBet.value = player.currentBet;
          players.value.forEach((p) => {
            if (p.id !== player.id && !p.hasFolded && !p.isAllIn) {
              p.hasActed = false;
            }
          });
        }

        player.lastAction = { type: 'allin', amount: allInAmount, text: `All In ${allInAmount}` };
        sound.playAllIn();
        break;
      }
    }

    // Check if only 1 player remains
    const activeUnfolded = players.value.filter((p) => !p.hasFolded);
    if (activeUnfolded.length === 1) {
      endHandWithSingleWinner(activeUnfolded[0]);
      return;
    }

    if (isBettingRoundComplete()) {
      checkAndTriggerAllInRunout();
    }

    // Proceed to next seat
    const nextIdx = (activePlayerIndex.value + 1) % players.value.length;
    nextTurn(nextIdx);
  }

  // Advance stages: Preflop -> Flop -> Turn -> River -> Showdown
  async function advanceStage() {
    const handToken = currentHandToken;
    if (currentHandToken !== handToken) return;

    if (isDealing.value) return;
    isDealing.value = true;
    clearAllPendingTimers();
    activePlayerIndex.value = -1;

    // Check if only 1 player remains
    const activeUnfolded = players.value.filter((p) => !p.hasFolded);
    if (activeUnfolded.length <= 1) {
      isDealing.value = false;
      if (activeUnfolded.length === 1) {
        endHandWithSingleWinner(activeUnfolded[0]);
      }
      return;
    }

    // 1. Brief pause after all players finish betting so table action is clearly readable
    await new Promise((r) => setTimeout(r, 650));
    if (currentHandToken !== handToken) return;

    // Reset current round bets (chips gathered into main pot)
    players.value.forEach((p) => {
      p.currentBet = 0;
      p.hasActed = false;
    });
    currentHighestBet.value = 0;
    minRaise.value = config.bigBlind;

    // Trigger all-in runout if players have no further actions
    checkAndTriggerAllInRunout();

    // Check how many players can still make decisions (not all-in and not folded)
    const canActCount = players.value.filter((p) => !p.hasFolded && !p.isAllIn).length;

    if (stage.value === 'preflop') {
      deck.value.pop(); // Burn card
      stage.value = 'flop';

      // Sequentially deal the 3 Flop cards with 3D flip animation & deal sound
      for (let i = 0; i < 3; i++) {
        communityCards.value.push(deck.value.pop()!);
        sound.playDeal();
        updateEvaluations();
        await new Promise((r) => setTimeout(r, 260));
        if (currentHandToken !== handToken) return;
      }
    } else if (stage.value === 'flop') {
      deck.value.pop(); // Burn card
      stage.value = 'turn';

      // Deal Turn card with 3D flip animation & deal sound
      communityCards.value.push(deck.value.pop()!);
      sound.playDeal();
      updateEvaluations();
      await new Promise((r) => setTimeout(r, 320));
      if (currentHandToken !== handToken) return;
    } else if (stage.value === 'turn') {
      deck.value.pop(); // Burn card
      stage.value = 'river';

      // Deal River card with 3D flip animation & deal sound
      communityCards.value.push(deck.value.pop()!);
      sound.playDeal();
      updateEvaluations();
      await new Promise((r) => setTimeout(r, 320));
      if (currentHandToken !== handToken) return;
    } else if (stage.value === 'river') {
      isDealing.value = false;
      // Move to Showdown!
      resolveShowdown();
      return;
    }

    if (currentHandToken !== handToken) return;

    updateEvaluations();
    isDealing.value = false;

    // If 0 or 1 player can act (or in all-in runout), wait a bit for cards to settle, then deal the next street
    if (canActCount <= 1 || isAllInRunout.value) {
      runoutTimerId = setTimeout(() => {
        runoutTimerId = null;
        if (currentHandToken !== handToken) return;
        advanceStage();
      }, 1200);
      return;
    }

    // Brief settling pause before the next player's turn begins
    await new Promise((r) => setTimeout(r, 350));
    if (currentHandToken !== handToken) return;

    // First player to act after dealer who hasn't folded or gone all-in
    const firstToAct = (dealerIndex.value + 1) % players.value.length;
    nextTurn(firstToAct);
  }

  // Calculate side pots and main pot
  function calculatePots(): Pot[] {
    const activeContributors = players.value.filter((p) => p.totalHandBet > 0);
    if (activeContributors.length === 0) return [];

    // Distinct bet amounts from all-in players + max bet
    const betLevels = Array.from(new Set(activeContributors.map((p) => p.totalHandBet))).sort((a, b) => a - b);

    const calculatedPots: Pot[] = [];
    let previousLevel = 0;

    for (const level of betLevels) {
      const contribution = level - previousLevel;
      if (contribution <= 0) continue;

      let potAmount = 0;
      const eligible: string[] = [];

      for (const p of activeContributors) {
        if (p.totalHandBet >= level) {
          potAmount += contribution;
          if (!p.hasFolded) {
            eligible.push(p.id);
          }
        } else if (p.totalHandBet > previousLevel) {
          potAmount += p.totalHandBet - previousLevel;
        }
      }

      if (potAmount > 0 && eligible.length > 0) {
        calculatedPots.push({
          amount: potAmount,
          eligiblePlayerIds: eligible,
        });
      }
      previousLevel = level;
    }

    return calculatedPots;
  }

  // Resolve Showdown (everyone reveals cards, determine winners of pots)
  function resolveShowdown() {
    stage.value = 'showdown';
    isShowdownActive.value = true;
    activePlayerIndex.value = -1;
    stopTurnTimer();

    // Reveal all cards of active players
    players.value.forEach((p) => {
      if (!p.hasFolded) {
        p.showCards = true;
        p.evaluation = evaluateHand([...p.cards, ...communityCards.value]);
      }
    });

    const potList = calculatePots();
    pots.value = potList;

    const winnersMap = new Map<string, { name: string; amount: number; desc: string }>();

    for (const pot of potList) {
      const eligiblePlayers = players.value.filter((p) => pot.eligiblePlayerIds.includes(p.id));
      if (eligiblePlayers.length === 0) continue;

      let bestScore = -1;
      let potWinners: Player[] = [];

      for (const p of eligiblePlayers) {
        const score = p.evaluation?.score ?? 0;
        if (score > bestScore) {
          bestScore = score;
          potWinners = [p];
        } else if (score === bestScore) {
          potWinners.push(p);
        }
      }

      const winShare = Math.floor(pot.amount / potWinners.length);
      for (const w of potWinners) {
        w.chips += winShare;
        const existing = winnersMap.get(w.id);
        if (existing) {
          existing.amount += winShare;
        } else {
          winnersMap.set(w.id, {
            name: w.name,
            amount: winShare,
            desc: w.evaluation?.description || w.evaluation?.rankName || '',
          });
        }
      }
    }

    showdownWinners.value = Array.from(winnersMap.entries()).map(([id, info]) => ({
      id,
      ...info,
    }));

    sound.playWin();

    recordHandHistory(Array.from(winnersMap.values()).map((w) => w.name));
    finishHand();
  }

  // End hand when all others fold
  function endHandWithSingleWinner(winner: Player) {
    stage.value = 'ended';
    isShowdownActive.value = true;
    activePlayerIndex.value = -1;
    stopTurnTimer();

    winner.chips += totalPot.value;
    showdownWinners.value = [
      {
        id: winner.id,
        name: winner.name,
        amount: totalPot.value,
        desc: '其他玩家弃牌',
      },
    ];

    sound.playWin();
    recordHandHistory([winner.name]);
    finishHand();
  }

  function finishHand() {
    // Update player profits & volume
    totalVolume.value += totalPot.value;
    players.value.forEach((p) => {
      // Net profit for this hand = (chips end - buyin)
      p.netProfit = p.chips - p.totalBuyIn;
    });

    stage.value = 'ended';
    activePlayerIndex.value = -1;
  }

  // Record history for "牌局回顾" modal
  function recordHandHistory(winnerNames: string[]) {
    const sbIndex = (dealerIndex.value + 1) % players.value.length;
    const bbIndex = (dealerIndex.value + 2) % players.value.length;

    const playerRecords: HandPlayerRecord[] = players.value.map((p, idx) => {
      let positionName = '';
      if (idx === dealerIndex.value) positionName = '庄家 (D)';
      else if (idx === sbIndex) positionName = '小盲 (SB)';
      else if (idx === bbIndex) positionName = '大盲 (BB)';

      const isWinner = winnerNames.includes(p.name);
      const profit = isWinner ? totalPot.value - p.totalHandBet : -p.totalHandBet;

      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isHuman: p.isHuman,
        positionName,
        cards: [...p.cards],
        handRankName: p.evaluation?.rankName || (p.hasFolded ? '弃牌' : '高牌'),
        actionText: p.lastAction?.text || (p.hasFolded ? '弃牌' : '跟注'),
        profit,
        isWinner,
        folded: p.hasFolded,
      };
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;

    history.value.unshift({
      id: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      handNumber: handNumber.value,
      timestamp: dateStr,
      blinds: { small: config.smallBlind, big: config.bigBlind },
      totalPot: totalPot.value,
      communityCards: [...communityCards.value],
      players: playerRecords,
      winnerNames,
    });

    handNumber.value += 1;
  }

  // Update real-time hand evaluations & win odds
  function updateEvaluations() {
    const activeUnfolded = players.value.filter((p) => !p.hasFolded);

    players.value.forEach((p) => {
      if (p.cards.length === 2) {
        p.evaluation = evaluateHand([...p.cards, ...communityCards.value]);
      }
    });

    // Compute win odds
    const odds = calculateWinOdds(
      activeUnfolded.map((p) => ({ id: p.id, cards: p.cards })),
      communityCards.value,
      250
    );

    activeUnfolded.forEach((p) => {
      p.winOdds = odds[p.id] || 0;
    });
  }

  // Format seconds to HH:MM:SS
  const formattedGameDuration = computed(() => {
    const s = gameDurationSeconds.value;
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  onMounted(() => {
    initPlayers();
    gameStartTime.value = Date.now();
    gameDurationTimerId = setInterval(() => {
      gameDurationSeconds.value = Math.floor((Date.now() - gameStartTime.value) / 1000);
    }, 1000);
  });

  onUnmounted(() => {
    stopTurnTimer();
    if (gameDurationTimerId) clearInterval(gameDurationTimerId);
  });

  return {
    config,
    players,
    communityCards,
    isDealing,
    stage,
    dealerIndex,
    activePlayerIndex,
    currentHighestBet,
    minRaise,
    totalPot,
    pots,
    handNumber,
    gameDurationSeconds,
    formattedGameDuration,
    history,
    totalVolume,
    hero,
    isHeroTurn,
    turnTimeRemaining,
    turnTotalTime,
    showdownWinners,
    isShowdownActive,
    autoCheckOrFold,
    autoCheck,
    autoCallAny,
    isAllInRunout,
    // Actions
    applyGameSettings,
    updatePlayerCount,
    buyInChips,
    startHand,
    stopTurnTimer,
    clearAllPendingTimers,
    executeAction,
    applyTimeExtension,
  };
}
