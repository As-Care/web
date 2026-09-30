<template>
  <div
    class="poker-table-outer w-full h-full flex items-center justify-center relative overflow-hidden select-none"
    :class="themeClass"
  >
    <!-- Background Ambient Glow & Hexagon / Carbon Pattern -->
    <div class="table-ambient-glow absolute inset-0 pointer-events-none"></div>

    <!-- The Poker Table (Felt & Wooden Rail) -->
    <div
      ref="tableRef"
      class="poker-table relative flex items-center justify-center"
    >
      <!-- Table Rail (Padded Leather / Wood Bevel) -->
      <div class="table-rail absolute inset-0 pointer-events-none">
        <!-- LED Ambient Light Ring -->
        <div class="table-led-ring absolute inset-1.5 md:inset-2.5"></div>
      </div>

      <!-- Inner Felt Area (felt texture watermark) -->
      <div class="table-felt absolute inset-3 md:inset-5 flex items-center justify-center overflow-hidden pointer-events-none">
        <!-- Felt Fabric Watermark Pattern / Logo -->
        <div class="felt-watermark absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none select-none">
          <span class="text-7xl md:text-9xl font-black">♠</span>
          <span class="text-xs md:text-sm tracking-[0.3em] font-serif uppercase mt-2">Red Dragon Poker</span>
        </div>
      </div>

      <!-- Center Stage: Community Cards & Pot -->
      <div class="center-stage z-10 flex flex-col items-center justify-center pointer-events-auto">
        <CommunityCards
          :cards="communityCards"
          :total-pot="totalPot"
          :pots="pots"
          :small-blind="config.smallBlind"
          :big-blind="config.bigBlind"
          :hand-number="handNumber"
          :card-size="isMobile ? 'sm' : 'lg'"
          :winning-cards="winningCards"
          :is-dealing="isDealing"
          :is-showdown="stage === 'showdown' || stage === 'ended'"
        />

        <!-- Prominent "开始游戏" Button (only in idle stage; ended stage is handled by ShowdownOverlay) -->
        <button
          v-if="stage === 'idle'"
          @click="$emit('start-hand')"
          class="start-game-btn mt-4 md:mt-6 px-8 md:px-10 py-2.5 md:py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm md:text-base shadow-[0_0_30px_rgba(245,158,11,0.7)] active:scale-95 transition-all duration-200 border-2 border-white/80 pointer-events-auto flex items-center gap-2.5 cursor-pointer animate-pulse"
        >
          <span>▶</span>
          <span>开始游戏</span>
        </button>
      </div>

      <!-- Player Seats positioned parametrically on top of table (z-20, never clipped by table) -->
      <div class="seats-layer absolute inset-0 pointer-events-none z-20">
        <!-- Dedicated isolated container for seat nodes so v-for fragment never conflicts with sibling v-if -->
        <div key="seats-nodes-wrapper" class="seats-nodes-wrapper absolute inset-0 pointer-events-none">
          <div
            v-for="(pos, idx) in seatPositions"
            :key="idx"
            class="seat-node absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 scale-[0.84] sm:scale-95 md:scale-100"
            :class="idx === 0 ? 'z-30' : 'z-10'"
            :style="{ left: `${pos.x}%`, top: `${pos.y}%` }"
          >
            <PlayerSeat
              :player="players[idx]"
              :is-active="idx === activePlayerIndex"
              :is-dealer="idx === dealerIndex"
              :blind-label="getBlindLabel(idx)"
              :card-size="isMobile ? 'xs' : 'sm'"
              :turn-time-remaining="turnTimeRemaining"
              :turn-total-time="turnTotalTime"
              :bet-offset-direction="pos.betDirection"
              :is-all-in-runout="isAllInRunout"
              :is-winner="Boolean(players[idx] && winnerIdSet.has(players[idx].id))"
              @sit="$emit('open-settings')"
              @extend-time="$emit('extend-time')"
            />
          </div>
        </div>

        <!-- Mobile Hero Turn Bottom Gradient Mask: 从下往上渐变遮罩(黑色到透明色)，盖住左右两边的玩家，手牌和头像在顶层不受影响 -->
        <div
          v-if="isMobile && isHeroTurn"
          key="mobile-hero-turn-mask"
          class="mobile-hero-turn-mask absolute -bottom-16 -left-[25vw] -right-[25vw] h-[55%] pointer-events-none z-20 transition-all duration-300 animate-fade-in"
          style="background: linear-gradient(to top, #07090e 0%, rgba(7, 9, 14, 0.98) 35%, rgba(7, 9, 14, 0.85) 60%, rgba(7, 9, 14, 0.3) 85%, transparent 100%);"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Card, GameStage, Player, Pot, TableConfig } from '../types/poker';
import CommunityCards from './CommunityCards.vue';
import PlayerSeat from './PlayerSeat.vue';

const props = defineProps<{
  players: Player[];
  communityCards: Card[];
  totalPot: number;
  pots: Pot[];
  stage: GameStage;
  activePlayerIndex: number;
  dealerIndex: number;
  config: TableConfig;
  handNumber: number;
  turnTimeRemaining: number;
  turnTotalTime: number;
  winningCards?: Card[];
  isDealing?: boolean;
  isAllInRunout?: boolean;
  isHeroTurn?: boolean;
  winners?: { id: string; name: string; amount?: number; desc?: string }[];
}>();

const winnerIdSet = computed(() => {
  if (!props.winners || props.winners.length === 0) return new Set<string>();
  if (props.stage !== 'showdown' && props.stage !== 'ended') return new Set<string>();
  return new Set(props.winners.map((w) => w.id));
});

defineEmits<{
  (e: 'start-hand'): void;
  (e: 'open-settings'): void;
  (e: 'extend-time'): void;
}>();

const windowWidth = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
const windowHeight = ref<number>(typeof window !== 'undefined' ? window.innerHeight : 768);

function handleResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

const isMobile = computed(() => windowWidth.value < 768 || windowHeight.value > windowWidth.value);

const themeClass = computed(() => {
  switch (props.config.theme) {
    case 'burgundy':
      return 'theme-burgundy';
    case 'midnight':
      return 'theme-midnight';
    case 'emerald':
    default:
      return 'theme-emerald';
  }
});

function getBlindLabel(idx: number): string {
  if (props.stage === 'idle') return '';
  const count = props.players.length;
  if (count < 2) return '';
  const sbIdx = (props.dealerIndex + 1) % count;
  const bbIdx = (props.dealerIndex + 2) % count;
  if (idx === sbIdx) return 'SB';
  if (idx === bbIdx) return 'BB';
  return '';
}

// Parametric Elliptical / Stadium Seat Distribution
// Seat 0 (Hero) is always at bottom center (angle = PI/2)
const seatPositions = computed(() => {
  const n = props.config.playerCount;
  const positions: { x: number; y: number; betDirection: 'up' | 'down' | 'left' | 'right' | 'center' }[] = [];

  const isPortrait = isMobile.value;
  // Radius percentages from table center (push closer to left/right rails on mobile so center is completely clear)
  const rx = isPortrait ? 43 : 43;
  const ry = isPortrait ? 42 : 39;

  for (let i = 0; i < n; i++) {
    // Hero is seat 0 at bottom center (Math.PI / 2)
    const angle = Math.PI / 2 + (2 * Math.PI * i) / n;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    let x = 50;
    const y = Math.round(50 + ry * sinA);

    if (isPortrait) {
      // In portrait/stadium table, push corner side players firmly against left/right rails
      if (Math.abs(cosA) > 0.05) {
        const sign = Math.sign(cosA);
        const expandedCos = sign * Math.pow(Math.abs(cosA), 0.35);
        x = Math.round(50 + rx * expandedCos);
      } else {
        x = 50;
      }
    } else {
      x = Math.round(50 + rx * cosA);
    }

    let betDirection: 'up' | 'down' | 'left' | 'right' | 'center' = 'center';
    if (y > 65) {
      // Bottom players: if center (Hero), place bet UP above cards on mobile, and to the right on PC
      betDirection = (x >= 40 && x <= 60) ? (isPortrait ? 'up' : 'right') : (x < 50 ? 'right' : 'left');
    } else if (y < 35) {
      // Top players: if center (Seat 4), place bet to the right so Total Pot badge is clear
      betDirection = (x >= 40 && x <= 60) ? 'right' : (x < 50 ? 'right' : 'left');
    } else if (x > 50) {
      betDirection = 'left';
    } else {
      betDirection = 'right';
    }

    positions.push({ x, y, betDirection });
  }

  return positions;
});
</script>

<style scoped>
.poker-table-outer {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 4px 16px;
}

/* PC Landscape Table (Expanded width and height for generous breathing room) */
.poker-table {
  position: relative;
  width: 98%;
  max-width: 1360px;
  height: 96%;
  max-height: 680px;
  min-height: 480px;
  border-radius: 280px;
  margin: 0 auto;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9);
}

/* Mobile Portrait Table (Flexes naturally to ensure 100% viewport fit without cutting off action controls) */
@media (max-width: 768px), (orientation: portrait) {
  .poker-table-outer {
    padding: 2px 4px !important;
    height: 100% !important;
    min-height: 0 !important;
  }
  .poker-table {
    width: 98% !important;
    max-width: 420px !important;
    height: 98% !important;
    max-height: 100% !important;
    min-height: 0 !important;
    border-radius: 160px !important;
  }
}

.table-rail {
  border-radius: inherit;
}

.table-led-ring {
  border-radius: inherit;
}

.table-felt {
  border-radius: inherit;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.85);
}

/* Themes */
.theme-burgundy {
  background: radial-gradient(circle at center, #1b0a10 0%, #080305 100%);
}
.theme-burgundy .table-felt {
  background: radial-gradient(circle at center, #991b1b 0%, #7f1d1d 60%, #450a0a 100%);
}
.theme-burgundy .table-rail {
  background: linear-gradient(135deg, #451a03 0%, #291104 50%, #150902 100%);
  border: 4px solid #78350f;
}
.theme-burgundy .table-led-ring {
  box-shadow: inset 0 0 15px rgba(251, 191, 36, 0.4), 0 0 20px rgba(239, 68, 68, 0.3);
}

.theme-emerald {
  background: radial-gradient(circle at center, #06241a 0%, #02120d 100%);
}
.theme-emerald .table-felt {
  background: radial-gradient(circle at center, #047857 0%, #065f46 60%, #022c22 100%);
}
.theme-emerald .table-rail {
  background: linear-gradient(135deg, #3f2512 0%, #241407 50%, #120902 100%);
  border: 4px solid #92400e;
}
.theme-emerald .table-led-ring {
  box-shadow: inset 0 0 15px rgba(52, 211, 153, 0.5), 0 0 20px rgba(245, 158, 11, 0.3);
}

.theme-midnight {
  background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
}
.theme-midnight .table-felt {
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 60%, #020617 100%);
}
.theme-midnight .table-rail {
  background: linear-gradient(135deg, #334155 0%, #1e293b 50%, #090d16 100%);
  border: 4px solid #475569;
}
.theme-midnight .table-led-ring {
  box-shadow: inset 0 0 15px rgba(56, 189, 248, 0.5), 0 0 20px rgba(148, 163, 184, 0.3);
}
</style>
