<template>
  <div
    class="player-seat relative flex flex-col items-center select-none"
    :class="{
      'is-active': isActive,
      'is-folded': player?.hasFolded,
      'is-hero': player?.isHuman,
    }"
  >
    <!-- When Seat is Empty -->
    <div
      v-if="!player"
      @click="$emit('sit')"
      class="empty-seat flex flex-col items-center justify-center cursor-pointer group transition-transform duration-200 hover:scale-105"
    >
      <div
        class="w-13 h-13 md:w-16 md:h-16 rounded-full bg-slate-900/60 border-2 border-dashed border-amber-400/40 flex items-center justify-center text-amber-300/70 group-hover:border-amber-400 group-hover:text-amber-300 group-hover:bg-slate-900/80 transition-all shadow-inner"
      >
        <span class="text-2xl font-light">+</span>
      </div>
      <span class="text-[10px] text-amber-200/60 mt-1 font-medium">空位</span>
    </div>

    <!-- When Seat is Occupied -->
    <template v-else>
      <!-- Hole Cards Display: Fixed reserved 2-card slot (提前把牌的位置占住，发牌时保证人物头像和整体块绝对不抖动) -->
      <div
        class="player-cards flex items-center justify-center gap-1 md:gap-1.5 mb-1.5 relative shrink-0"
        :class="[
          player.isHuman
            ? 'w-[110px] h-[74px]'
            : 'w-[70px] h-[44px] md:w-[88px] md:h-[56px]',
          player.hasFolded ? 'opacity-40 grayscale' : '',
        ]"
      >
        <!-- Slot 0 (First Card) -->
        <div
          class="hole-card-slot flex items-center justify-center shrink-0"
          :class="player.isHuman ? 'w-[52px] h-[74px]' : 'w-[32px] h-[44px] md:w-[40px] md:h-[56px]'"
        >
          <div
            v-if="player.cards[0]"
            :key="`${player.id}-0`"
            class="hole-card-wrapper inline-flex deal-card-anim-0"
          >
            <CardView
              :card="player.cards[0]"
              :face-down="!player.showCards"
              :size="effectiveCardSize"
              :animate-flip="player.isHuman"
            />
          </div>
        </div>

        <!-- Slot 1 (Second Card) -->
        <div
          class="hole-card-slot flex items-center justify-center shrink-0"
          :class="player.isHuman ? 'w-[52px] h-[74px]' : 'w-[32px] h-[44px] md:w-[40px] md:h-[56px]'"
        >
          <div
            v-if="player.cards[1]"
            :key="`${player.id}-1`"
            class="hole-card-wrapper inline-flex deal-card-anim-1"
          >
            <CardView
              :card="player.cards[1]"
              :face-down="!player.showCards"
              :size="effectiveCardSize"
              :animate-flip="player.isHuman"
            />
          </div>
        </div>

        <!-- Real-Time Equity / Win Rate Badge (All-In Runout: 跑马实时胜率) -->
        <div
          v-if="showWinRate && player.cards.length > 0"
          class="win-rate-badge absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full border shadow-lg backdrop-blur-md whitespace-nowrap"
          :class="winRateBadgeClass"
        >
          <span class="text-[9px] md:text-[10px] font-medium opacity-85">胜率</span>
          <span class="text-[10px] md:text-[11px] font-mono font-black">{{ player.winOdds }}%</span>
        </div>
      </div>

      <!-- Avatar with Circular Ring & Glow -->
      <div class="avatar-container relative flex items-center justify-center">
        <!-- Winner Golden Radiance Halo Ring (无限循环金光特效) -->
        <div
          v-if="isWinner"
          class="winner-golden-halo absolute -inset-1.5 md:-inset-2 rounded-full pointer-events-none z-10"
        ></div>

        <!-- Dealer Button (D) snug on avatar shoulder -->
        <div
          v-if="isDealer"
          class="dealer-button absolute -top-1 -right-1 z-20 w-4 h-4 md:w-6 md:h-6 rounded-full bg-slate-100 text-slate-950 font-black text-[8px] md:text-[11px] flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.9)] border border-slate-300"
        >
          D
        </div>

        <!-- Small Blind / Big Blind Badge snug on avatar shoulder -->
        <div
          v-if="blindLabel"
          class="blind-badge absolute -top-1 -left-1 z-20 px-1 py-0.5 rounded text-[8px] md:text-[10px] font-black text-white shadow-md border border-white/20"
          :class="blindLabel === 'SB' ? 'bg-indigo-600' : 'bg-purple-600'"
        >
          {{ blindLabel }}
        </div>
        <!-- Circular Progress Ring for Active Bot (viewBox保证几何精确，超顺滑流线倒计时) -->
        <svg
          v-if="isActive && !player.isHuman"
          viewBox="0 0 100 100"
          class="timer-svg absolute -inset-1 md:-inset-1.5 w-[calc(100%+8px)] md:w-[calc(100%+12px)] h-[calc(100%+8px)] md:h-[calc(100%+12px)] -rotate-90 pointer-events-none z-10 origin-center"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            stroke-width="3.5"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            :stroke="timerColor"
            stroke-width="3.5"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            class="timer-progress-circle"
          />
        </svg>

        <!-- Player Avatar Image (compact on mobile) -->
        <div
          class="avatar-box w-10 h-10 sm:w-12 sm:h-12 md:w-15 md:h-15 rounded-full overflow-hidden border-2 transition-all duration-300 relative shadow-lg"
          :class="[
            isWinner
              ? 'border-amber-300 winner-avatar-glow'
              : isActive
                ? 'border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-105'
                : 'border-slate-700/80 bg-slate-800',
            player.hasFolded ? 'opacity-40 grayscale' : '',
          ]"
        >
          <img
            :src="player.avatar"
            :alt="player.name"
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <!-- Action Status Badge Overlay (e.g. 弃牌, All In, 跟注) -->
        <div
          v-if="player.lastAction"
          class="status-bubble absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 md:px-2 py-0.5 rounded-full text-[8px] md:text-[10px] font-bold shadow-lg border backdrop-blur-md whitespace-nowrap z-20"
          :class="actionBadgeClass"
        >
          {{ player.lastAction.text }}
        </div>
      </div>

      <!-- Player Info Pill (compact on mobile) -->
      <div
        class="player-info-pill mt-1 md:mt-2 px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg bg-slate-950/90 border shadow-md flex flex-col items-center min-w-[58px] sm:min-w-[68px] md:min-w-[76px] max-w-[80px] sm:max-w-[95px] md:max-w-[105px] relative"
        :class="player.isHuman ? 'border-amber-500/50 bg-slate-900/95' : 'border-slate-800'"
      >
        <!-- Hand Rank for Hero, or Bot Nickname (above Chips, replacing 人机1, 人机2, 人机3) -->
        <span
          v-if="player.isHuman && player.evaluation"
          class="text-[9px] md:text-[11px] font-semibold text-slate-300 leading-tight"
        >
          {{ player.evaluation.rankName }}
        </span>
        <span
          v-else
          class="player-name text-[9px] md:text-[11px] font-bold text-slate-200 truncate w-full text-center leading-tight"
        >
          {{ displayName }}
        </span>

        <!-- Chips -->
        <span class="player-chips text-[10px] sm:text-[11px] md:text-[13px] font-black text-amber-400 font-mono leading-tight mt-0.5">
          {{ player.chips.toLocaleString() }}
        </span>

        <!-- Hero Horizontal Countdown Bar (matching Image 1 & Image 2) -->
        <div
          v-if="player.isHuman && isActive"
          class="hero-timer-bar absolute -bottom-1.5 inset-x-1 h-1.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700/60 shadow-sm"
        >
          <div
            class="h-full rounded-full relative timer-progress-bar"
            :class="timerColorClass"
            :style="{ width: `${heroTimerPercent}%` }"
          >
            <!-- Glowing tip head -->
            <div class="absolute right-0 top-0 bottom-0 w-2 bg-white rounded-full shadow-[0_0_6px_#fff]"></div>
          </div>
        </div>
      </div>

      <!-- Time Extension Button (⏱ 免费) for Hero (matching Image 1 & 2) -->
      <button
        v-if="player.isHuman && isActive"
        @click="$emit('extend-time')"
        :disabled="player.extensionsUsed >= 1"
        class="hero-extension-btn absolute -right-12 bottom-0 z-30 px-2 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-amber-300 flex items-center gap-1 text-[10px] font-bold shadow-md transition active:scale-95 whitespace-nowrap"
        :class="{ 'opacity-40 cursor-not-allowed': player.extensionsUsed >= 1 }"
        title="点击延时10秒"
      >
        <span>⏱</span>
        <span>{{ player.extensionsUsed >= 1 ? '+10s' : '免费' }}</span>
      </button>

      <!-- Bet Chips in front of player (on table felt) -->
      <div
        v-if="player.currentBet > 0"
        class="bet-chips-container absolute z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/85 border border-amber-500/40 shadow-lg text-amber-300 font-bold text-[11px]"
        :style="betChipPosition"
      >
        <span class="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-300 border border-white/60 inline-flex items-center justify-center text-[7px] text-slate-950 font-black">
          $
        </span>
        <span class="font-mono">{{ player.currentBet.toLocaleString() }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '../types/poker';
import { PERSONALITY_INFO } from '../utils/avatars';
import CardView from './CardView.vue';

const props = withDefaults(
  defineProps<{
    player?: Player;
    isActive?: boolean;
    isDealer?: boolean;
    blindLabel?: string;
    cardSize?: 'xs' | 'sm' | 'md' | 'lg';
    turnTimeRemaining?: number;
    turnTotalTime?: number;
    betOffsetDirection?: 'up' | 'down' | 'left' | 'right' | 'center';
    isAllInRunout?: boolean;
    isWinner?: boolean;
  }>(),
  {
    isActive: false,
    isDealer: false,
    blindLabel: '',
    cardSize: 'sm',
    turnTimeRemaining: 20,
    turnTotalTime: 20,
    betOffsetDirection: 'center',
    isAllInRunout: false,
    isWinner: false,
  }
);

defineEmits<{
  (e: 'sit'): void;
  (e: 'extend-time'): void;
}>();

// Show real-time equity / win rate when all remaining players have no further actions (跑马)
const showWinRate = computed(() => {
  if (!props.player || props.player.hasFolded) return false;
  if (!props.player.showCards) return false;
  if (props.player.cards.length !== 2) return false;
  if (props.player.winOdds === undefined) return false;
  return !!props.isAllInRunout;
});

const winRateBadgeClass = computed(() => {
  const odds = props.player?.winOdds ?? 0;
  if (odds === 100) {
    return 'bg-gradient-to-r from-amber-500 to-yellow-400 border-amber-300 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.8)]';
  }
  if (odds >= 60) {
    return 'bg-emerald-950/95 border-emerald-500/80 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  }
  if (odds >= 40) {
    return 'bg-amber-950/95 border-amber-500/80 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.4)]';
  }
  if (odds > 0) {
    return 'bg-rose-950/95 border-rose-500/80 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.4)]';
  }
  return 'bg-slate-950/90 border-slate-700 text-slate-400 opacity-70';
});

const botColor = computed(() => {
  if (!props.player?.personality) return '#94a3b8';
  return PERSONALITY_INFO[props.player.personality]?.color || '#94a3b8';
});

// Display name: always shows the player's actual name, not the personality tag
const displayName = computed(() => {
  if (!props.player) return '';
  return props.player.name;
});

// Human player's cards are scaled up for better readability and focus
const effectiveCardSize = computed(() => {
  if (props.player?.isHuman) {
    return 'md';
  }
  return props.cardSize;
});

// Timer ring geometry for bots (exact 100x100 viewBox with r=44)
const TIMER_RADIUS = 44;
const circumference = 2 * Math.PI * TIMER_RADIUS;
const strokeDashoffset = computed(() => {
  if (!props.isActive || !props.turnTotalTime) return circumference;
  const ratio = Math.max(0, Math.min(1, props.turnTimeRemaining / props.turnTotalTime));
  return circumference * (1 - ratio);
});

const heroTimerPercent = computed(() => {
  if (!props.turnTotalTime) return 0;
  return Math.max(0, Math.min(100, (props.turnTimeRemaining / props.turnTotalTime) * 100));
});

const timerColor = computed(() => {
  if (props.turnTimeRemaining <= 4) return '#ef4444';
  if (props.turnTimeRemaining <= 8) return '#f59e0b';
  return '#10b981';
});

const timerColorClass = computed(() => {
  if (props.turnTimeRemaining <= 4) return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]';
  if (props.turnTimeRemaining <= 8) return 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
  return 'bg-gradient-to-r from-emerald-500 to-amber-300 shadow-[0_0_8px_rgba(52,211,153,0.8)]';
});

const actionBadgeClass = computed(() => {
  const type = props.player?.lastAction?.type;
  switch (type) {
    case 'fold':
      return 'bg-slate-700/90 text-slate-300 border-slate-500';
    case 'allin':
      return 'bg-amber-600/95 text-white border-amber-400 shadow-amber-500/50';
    case 'raise':
    case 'bet':
      return 'bg-rose-600/90 text-white border-rose-400';
    case 'call':
      return 'bg-blue-600/90 text-white border-blue-400';
    case 'check':
    default:
      return 'bg-slate-700/90 text-white border-slate-500';
  }
});

const betChipPosition = computed(() => {
  switch (props.betOffsetDirection) {
    case 'up':
      return { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' };
    case 'down':
      return { top: '100%', left: '50%', transform: 'translate(-50%, 6px)' };
    case 'left':
      return { right: '100%', top: '50%', transform: 'translate(-6px, -50%)' };
    case 'right':
      return { left: '100%', top: '50%', transform: 'translate(6px, -50%)' };
    case 'center':
    default:
      return { bottom: '-22px', left: '50%', transform: 'translateX(-50%)' };
  }
});
</script>

<style scoped>
.player-seat {
  transition: opacity 0.2s ease-out;
}

.avatar-box {
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6);
}

.hero-extension-btn {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

/* Hole Card Deal Animations (发手牌动画) */
.deal-card-anim-0 {
  animation: dealHoleCardLeft 0.36s cubic-bezier(0.18, 0.9, 0.3, 1.1) forwards;
}

.deal-card-anim-1 {
  animation: dealHoleCardRight 0.36s cubic-bezier(0.18, 0.9, 0.3, 1.1) forwards;
}

@keyframes dealHoleCardLeft {
  0% {
    opacity: 0;
    transform: translateY(-28px) scale(0.7) rotate(-10deg);
    filter: drop-shadow(0 14px 18px rgba(0, 0, 0, 0.8));
  }
  65% {
    opacity: 1;
    transform: translateY(2px) scale(1.04) rotate(1deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  }
}

@keyframes dealHoleCardRight {
  0% {
    opacity: 0;
    transform: translateY(-28px) scale(0.7) rotate(10deg);
    filter: drop-shadow(0 14px 18px rgba(0, 0, 0, 0.8));
  }
  65% {
    opacity: 1;
    transform: translateY(2px) scale(1.04) rotate(-1deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
    filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.5));
  }
}

.win-rate-badge {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
  animation: badgePop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes badgePop {
  from {
    opacity: 0;
    transform: translate(-50%, 4px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}

/* Winner infinite golden glow effect */
.winner-avatar-glow {
  animation: goldenLoopGlow 1.8s infinite ease-in-out !important;
  z-index: 15;
}

@keyframes goldenLoopGlow {
  0%, 100% {
    box-shadow: 0 0 12px rgba(251, 191, 36, 0.8), 0 0 24px rgba(245, 158, 11, 0.6), inset 0 0 10px rgba(253, 224, 71, 0.5);
    border-color: rgba(253, 224, 71, 0.95);
    transform: scale(1.05);
  }
  50% {
    box-shadow: 0 0 22px rgba(251, 191, 36, 1), 0 0 42px rgba(245, 158, 11, 0.9), 0 0 55px rgba(217, 119, 6, 0.5), inset 0 0 16px rgba(253, 224, 71, 0.8);
    border-color: #ffffff;
    transform: scale(1.1);
  }
}

.winner-golden-halo {
  border: 2px solid rgba(251, 191, 36, 0.85);
  animation: goldenHaloPulse 1.8s infinite ease-in-out;
}

@keyframes goldenHaloPulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.7;
    box-shadow: 0 0 14px rgba(251, 191, 36, 0.8), inset 0 0 10px rgba(245, 158, 11, 0.4);
  }
  50% {
    transform: scale(1.16);
    opacity: 1;
    box-shadow: 0 0 28px rgba(251, 191, 36, 1), 0 0 45px rgba(245, 158, 11, 0.8), inset 0 0 18px rgba(253, 224, 71, 0.7);
  }
}

/* Ultra-smooth continuous timer progress ring & bar */
.timer-progress-circle {
  transition: stroke-dashoffset 0.04s linear, stroke 0.3s ease;
  filter: drop-shadow(0 0 3px currentColor);
}

.timer-progress-bar {
  transition: width 0.04s linear;
}
</style>
