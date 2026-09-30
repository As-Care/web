<template>
  <div
    v-if="show"
    class="showdown-overlay-container absolute inset-0 z-40 pointer-events-none"
  >
    <!-- Top Winner Announcement Banner (Guaranteed dead-center in upper felt) -->
    <div class="winner-banner-wrapper absolute inset-x-0 top-[17%] sm:top-[20%] md:top-[22%] flex justify-center px-2 sm:px-4 pointer-events-none">
      <div
        class="winner-banner-top pointer-events-auto bg-slate-950/95 border-2 border-amber-500/70 rounded-2xl px-3.5 py-2 sm:px-6 sm:py-3 shadow-[0_8px_30px_rgba(245,158,11,0.45)] backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-center gap-2 sm:gap-3.5 animate-slide-down max-w-[96vw] sm:max-w-[90vw] md:max-w-2xl text-center sm:text-left"
      >
        <span class="text-xl sm:text-2xl md:text-3xl animate-bounce shrink-0">👑</span>
        <div class="flex flex-col min-w-0 max-w-full">
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span class="text-xs sm:text-sm md:text-base font-black text-amber-300 tracking-wide break-words">
              {{ winnerTitle }}
            </span>
            <span
              v-if="winnerHandDesc"
              class="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold break-words"
            >
              {{ winnerHandDesc }}
            </span>
          </div>
        </div>

        <!-- Pot Amount Won -->
        <div class="pot-badge px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-400 font-mono font-black text-xs sm:text-sm md:text-base shadow-inner shrink-0 whitespace-nowrap">
          +{{ totalWon.toLocaleString() }}
        </div>
      </div>
    </div>

    <!-- Bottom "开始下一手对局" Button (Moved up to clear Hero cards, dead-center in lower felt) -->
    <div class="next-hand-wrapper absolute inset-x-0 bottom-[28%] md:bottom-[30%] flex justify-center pointer-events-none">
      <div class="next-hand-bottom pointer-events-auto animate-slide-up whitespace-nowrap">
        <button
          @click="$emit('next-hand')"
          class="px-8 py-2.5 md:px-10 md:py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm md:text-base shadow-[0_0_35px_rgba(245,158,11,0.85)] border-2 border-white/90 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2"
        >
          <span>▶</span>
          <span>开始下一手对局</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import confetti from 'canvas-confetti';
import { computed, watch } from 'vue';

const props = defineProps<{
  show: boolean;
  winners: { id: string; name: string; amount: number; desc: string }[];
}>();

defineEmits<{
  (e: 'next-hand'): void;
}>();

const winnerTitle = computed(() => {
  if (props.winners.length === 0) return '牌局结束';
  if (props.winners.length === 1) return `${props.winners[0].name} 赢得底池！`;
  return `${props.winners.map((w) => w.name).join(' & ')} 平分底池！`;
});

const winnerHandDesc = computed(() => {
  if (props.winners.length === 0) return '';
  return props.winners.map((w) => w.desc).filter(Boolean).join(' / ');
});

const totalWon = computed(() => {
  return props.winners.reduce((sum, w) => sum + w.amount, 0);
});

watch(
  () => props.show,
  (val) => {
    if (val) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.3 },
          colors: ['#f59e0b', '#fbbf24', '#ffffff', '#ef4444'],
        });
      } catch {
        // ignore
      }
    }
  }
);
</script>

<style scoped>
.animate-slide-down {
  animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
