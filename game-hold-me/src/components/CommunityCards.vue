<template>
  <div class="community-area flex flex-col items-center justify-center select-none pointer-events-none">
    <!-- Main Pot & Side Pots Badge (compact & well-spaced from community cards, height preserved to prevent jump) -->
    <div
      class="pot-display mb-2 md:mb-3 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-slate-950/90 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.35)] backdrop-blur-md flex items-center gap-2 pointer-events-auto transition-opacity duration-200"
      :class="isShowdown ? 'invisible opacity-0 pointer-events-none' : 'visible opacity-100'"
    >
      <div class="flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border border-white/80 shadow-sm flex items-center justify-center text-[10px] font-black text-slate-950">
          $
        </span>
        <span class="text-xs md:text-sm text-amber-200 font-bold">总底池</span>
      </div>
      <span class="text-lg md:text-xl font-black text-amber-400 tracking-wide font-mono">
        {{ totalPot.toLocaleString() }}
      </span>

      <!-- Side Pots if any -->
      <template v-if="sidePots.length > 1">
        <span class="text-xs text-slate-500">|</span>
        <span class="text-xs text-amber-300 font-bold">
          边池({{ sidePots.length - 1 }})
        </span>
      </template>
    </div>

    <!-- 5 Community Cards Track (Flop 3, Turn 1, River 1) -->
    <div class="cards-track my-1 md:my-2 flex items-center gap-1 md:gap-3 pointer-events-auto">
      <div
        v-for="i in 5"
        :key="cards[i - 1] ? `card-${handNumber}-${cards[i - 1].suit}-${cards[i - 1].rank}-${i}` : `empty-${i}`"
        class="card-slot-container"
      >
        <!-- Dealt Card with 3D Flip & Fade-in -->
        <div v-if="cards[i - 1]" class="card-slot">
          <CardView
            :card="cards[i - 1]"
            :size="cardSize"
            :animate-flip="true"
            :highlight="isHighlighted(cards[i - 1])"
          />
        </div>

        <!-- Empty Slot Placeholder (Inspired by hold-em/index.html) -->
        <div
          v-else
          class="empty-card-slot flex flex-col items-center justify-center cursor-default transition-all"
          :class="slotSizeClass"
        >
          <span class="text-xs md:text-sm font-semibold opacity-40 leading-none mb-1">+</span>
          <span class="text-[9px] md:text-[11px] font-bold opacity-60 tracking-wider whitespace-nowrap">{{ getSlotLabel(i - 1) }}</span>
        </div>
      </div>
    </div>

    <!-- Room / Hand Subtext or Dealing Status on Table (Locked constant height to prevent any table jitter) -->
    <div class="table-subtext mt-3 md:mt-4 h-7 min-h-[28px] max-h-[28px] text-[11px] md:text-xs text-amber-100/60 flex items-center justify-center tracking-wider overflow-hidden">
      <div
        v-if="isDealing"
        class="h-full flex items-center gap-1.5 px-3 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 font-bold animate-pulse shadow-sm"
      >
        <span>🎴</span>
        <span>荷官发牌中...</span>
      </div>
      <div
        v-else
        class="h-full flex items-center gap-2 px-3 rounded-full bg-slate-950/40 border border-transparent text-amber-100/60 font-medium"
      >
        <span>德州扑克</span>
        <span>•</span>
        <span>盲注 {{ smallBlind }}/{{ bigBlind }}</span>
        <span v-if="handNumber > 0">•</span>
        <span v-if="handNumber > 0">第 {{ handNumber }} 手</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card, Pot } from '../types/poker';
import CardView from './CardView.vue';

const props = withDefaults(
  defineProps<{
    cards: Card[];
    totalPot: number;
    pots?: Pot[];
    smallBlind: number;
    bigBlind: number;
    handNumber?: number;
    cardSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    winningCards?: Card[];
    isDealing?: boolean;
    isShowdown?: boolean;
  }>(),
  {
    pots: () => [],
    handNumber: 1,
    cardSize: 'lg',
    winningCards: () => [],
    isDealing: false,
    isShowdown: false,
  }
);

const sidePots = computed(() => props.pots || []);

const slotSizeClass = computed(() => {
  switch (props.cardSize) {
    case 'xs':
      return 'w-[32px] h-[44px] rounded-[5px]';
    case 'sm':
      return 'w-[40px] h-[56px] rounded-[6px]';
    case 'md':
      return 'w-[52px] h-[74px] rounded-[8px]';
    case 'xl':
      return 'w-[82px] h-[118px] rounded-[10px]';
    case 'lg':
    default:
      return 'w-[70px] h-[100px] rounded-[8px]';
  }
});

function getSlotLabel(index: number): string {
  if (index < 3) return '翻牌';
  if (index === 3) return '转牌';
  return '河牌';
}

function isHighlighted(card: Card): boolean {
  if (!props.winningCards || props.winningCards.length === 0) return false;
  return props.winningCards.some((c) => c.suit === card.suit && c.rank === card.rank);
}
</script>

<style scoped>
.pot-display {
  letter-spacing: 0.05em;
}

.table-subtext {
  height: 28px !important;
  min-height: 28px !important;
  max-height: 28px !important;
  box-sizing: border-box;
}

.empty-card-slot {
  background: rgba(255, 255, 255, 0.04);
  border: 1.5px dashed rgba(255, 255, 255, 0.22);
  color: rgba(255, 255, 255, 0.6);
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.35);
  box-sizing: border-box;
}

.empty-card-slot:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.35);
}
</style>
