<template>
  <div
    class="poker-card-container select-none transition-all duration-300"
    :class="[
      sizeClass,
      highlight ? 'is-highlight' : '',
    ]"
  >
    <!-- 3D Flip Entrance Mode (for newly dealt community cards) -->
    <div v-if="animateFlip && !faceDown && card" class="card-flipper">
      <!-- Back Face (visible during initial phase of flip) -->
      <div class="card-face card-back">
        <div class="card-back-pattern">
          <div class="inner-border">
            <div class="back-logo">♠</div>
          </div>
        </div>
      </div>

      <!-- Front Face (unveiled dynamically as card rotates) -->
      <div class="card-face card-front">
        <div class="card-corner-top">
          <span class="card-val" :class="suitClass">{{ rankText }}</span>
          <span class="card-suit-corner" :class="suitClass">{{ card.suit }}</span>
        </div>

        <div class="card-suit-big" :class="suitClass">
          {{ card.suit }}
        </div>
      </div>
    </div>

    <!-- Static Face Up Mode (e.g. hole cards or already dealt cards) -->
    <div v-else-if="!faceDown && card" class="card-face card-front static-face">
      <div class="card-corner-top">
        <span class="card-val" :class="suitClass">{{ rankText }}</span>
        <span class="card-suit-corner" :class="suitClass">{{ card.suit }}</span>
      </div>

      <div class="card-suit-big" :class="suitClass">
        {{ card.suit }}
      </div>
    </div>

    <!-- Static Face Down Mode (e.g. bots' hidden hole cards) -->
    <div v-else class="card-face card-back static-face">
      <div class="card-back-pattern">
        <div class="inner-border">
          <div class="back-logo">♠</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '../types/poker';
import { RANK_NAMES } from '../utils/evaluator';

const props = withDefaults(
  defineProps<{
    card?: Card;
    faceDown?: boolean;
    highlight?: boolean;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    winOdds?: number;
    animateFlip?: boolean;
  }>(),
  {
    faceDown: false,
    highlight: false,
    size: 'md',
    animateFlip: false,
  }
);

const isRed = computed(() => {
  if (!props.card) return false;
  return props.card.suit === '♥' || props.card.suit === '♦';
});

const suitClass = computed(() => {
  return isRed.value ? 'suit-red' : 'suit-black';
});

const rankText = computed(() => {
  if (!props.card) return '';
  return RANK_NAMES[props.card.rank] || String(props.card.rank);
});

const sizeClass = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'size-xs';
    case 'sm':
      return 'size-sm';
    case 'lg':
      return 'size-lg';
    case 'xl':
      return 'size-xl';
    case 'md':
    default:
      return 'size-md';
  }
});

const oddsColorClass = computed(() => {
  if (props.winOdds === undefined) return '';
  if (props.winOdds >= 80) return 'bg-emerald-600/90 text-white';
  if (props.winOdds >= 40) return 'bg-amber-600/90 text-white';
  return 'bg-rose-900/90 text-slate-200';
});
</script>

<style scoped>
.poker-card-container {
  perspective: 900px;
  -webkit-perspective: 900px;
  display: inline-flex;
  position: relative;
  box-sizing: border-box;
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 3D Flip Motion Shell */
.card-flipper {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
  animation: cardFlipEntrance 0.56s cubic-bezier(0.18, 0.89, 0.32, 1.1) forwards;
}

@keyframes cardFlipEntrance {
  0% {
    opacity: 0;
    transform: translateY(-28px) scale(0.75) rotateY(-180deg);
    filter: drop-shadow(0 20px 25px rgba(0, 0, 0, 0.75));
  }
  30% {
    opacity: 1;
  }
  70% {
    transform: translateY(3px) scale(1.06) rotateY(12deg);
    filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5));
  }
  85% {
    transform: translateY(-1px) scale(0.99) rotateY(-4deg);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1) rotateY(0deg);
    filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45));
  }
}

/* Card Faces */
.card-face {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-sizing: border-box;
  overflow: hidden;
}

.card-face.static-face {
  position: relative;
  transform: none !important;
  backface-visibility: visible !important;
  -webkit-backface-visibility: visible !important;
}

/* Front Face: Clean pure white surface matching hold-em/index.html */
.card-front {
  background: #ffffff;
  border: 1px solid #d0d7de;
  border-radius: inherit;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  z-index: 2;
  display: flex;
  flex-direction: column;
}

/* Back Face: Patterned Casino Card Back */
.card-back {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: inherit;
  overflow: hidden;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
  z-index: 1;
}

/* 3D flipper faces */
.card-flipper .card-front {
  transform: rotateY(0deg);
}

.card-flipper .card-back {
  transform: rotateY(180deg);
}

/* Card Sheen Reflection Effect on landing */
.card-flipper .card-front::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0) 60%);
  opacity: 0;
  pointer-events: none;
  animation: cardSheen 0.56s ease-out forwards;
}

@keyframes cardSheen {
  0%, 45% {
    opacity: 0;
  }
  65% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
  }
}

/* Suit Colors */
.suit-black {
  color: #111827; /* Deep Slate Black */
}

.suit-red {
  color: #dc2626; /* Crisp Vivid Casino Red */
}

/* Typography from hold-em/index.html */
.card-corner-top {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1;
  z-index: 2;
  position: relative;
}

.card-val {
  font-weight: 900;
  line-height: 1;
  letter-spacing: -0.5px;
}

.card-suit-corner {
  line-height: 1;
}

.card-suit-big {
  position: absolute;
  top: 52%;
  left: 50%;
  transform: translate(-50%, -46%);
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.12));
  pointer-events: none;
  z-index: 1;
}

/* Size Variants */
.size-xs {
  width: 32px;
  height: 44px;
  border-radius: 4px;
}
.size-xs .card-front {
  padding: 2px 3px;
}
.size-xs .card-val {
  font-size: 11px;
}
.size-xs .card-suit-corner {
  font-size: 8px;
  margin-top: 1px;
}
.size-xs .card-suit-big {
  font-size: 18px;
}

.size-sm {
  width: 40px;
  height: 56px;
  border-radius: 5px;
}
.size-sm .card-front {
  padding: 3px 4px;
}
.size-sm .card-val {
  font-size: 13px;
}
.size-sm .card-suit-corner {
  font-size: 9px;
  margin-top: 1px;
}
.size-sm .card-suit-big {
  font-size: 24px;
}

.size-md {
  width: 52px;
  height: 74px;
  border-radius: 8px;
}
.size-md .card-flipper,
.size-md .card-face {
  border-radius: 8px;
}
.size-md .card-front {
  padding: 4px 6px;
}
.size-md .card-val {
  font-size: 17px;
}
.size-md .card-suit-corner {
  font-size: 11px;
  margin-top: 2px;
}
.size-md .card-suit-big {
  font-size: 32px;
}

.size-lg {
  width: 70px;
  height: 100px;
  border-radius: 8px;
}
.size-lg .card-flipper,
.size-lg .card-face {
  border-radius: 8px;
}
.size-lg .card-front {
  padding: 6px 8px;
}
.size-lg .card-val {
  font-size: 22px;
}
.size-lg .card-suit-corner {
  font-size: 14px;
  margin-top: 2px;
}
.size-lg .card-suit-big {
  font-size: 46px;
}

.size-xl {
  width: 82px;
  height: 118px;
  border-radius: 10px;
}
.size-xl .card-flipper,
.size-xl .card-face {
  border-radius: 10px;
}
.size-xl .card-front {
  padding: 8px 10px;
}
.size-xl .card-val {
  font-size: 25px;
}
.size-xl .card-suit-corner {
  font-size: 16px;
  margin-top: 3px;
}
.size-xl .card-suit-big {
  font-size: 52px;
}

/* Highlight / Winning hand state */
.is-highlight .card-front {
  border-color: #fbbf24 !important;
  border-radius: inherit !important;
  box-shadow: 0 0 0 2px #fbbf24, 0 0 20px rgba(251, 191, 36, 0.85), 0 6px 16px rgba(0, 0, 0, 0.5) !important;
}

.is-highlight {
  transform: translateY(-4px) scale(1.05);
  z-index: 10;
}

/* Odds Badge */
.odds-badge {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 8px;
  font-weight: 800;
  padding: 1px 3px;
  border-radius: 3px;
  z-index: 5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

/* Patterned Back */
.card-back-pattern {
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, #b91c1c 10%, #6b1111 90%);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  box-sizing: border-box;
}

.inner-border {
  width: 100%;
  height: 100%;
  border: 1px solid rgba(251, 191, 36, 0.4);
  border-radius: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    45deg,
    rgba(251, 191, 36, 0.08),
    rgba(251, 191, 36, 0.08) 2px,
    transparent 2px,
    transparent 5px
  );
}

.back-logo {
  color: rgba(251, 191, 36, 0.7);
  font-size: 0.9em;
}
</style>
