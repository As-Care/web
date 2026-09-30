<template>
  <div
    v-if="isOpen"
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-0 bg-black/80 backdrop-blur-md animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="modal-card bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    >
      <!-- Header with generous padding -->
      <div class="modal-header px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="text-xl">🏆</span>
          <h2 class="text-base sm:text-lg font-bold text-white tracking-wide">实时排名</h2>
        </div>

        <div class="flex items-center gap-4">
          <button
            @click="$emit('close')"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Table Header with horizontal padding -->
      <div class="table-header-row grid grid-cols-12 px-4 sm:px-6 py-2.5 bg-slate-900/50 text-[11px] font-bold text-slate-400 border-b border-slate-800/60 tracking-wider">
        <div class="col-span-6">昵称</div>
        <div class="col-span-3 text-right">带入</div>
        <div class="col-span-3 text-right">盈亏</div>
      </div>

      <!-- Player Leaderboard Rows -->
      <div class="flex-1 overflow-y-auto divide-y divide-slate-800/40 py-1">
        <div
          v-for="player in sortedPlayers"
          :key="player.id"
          class="grid grid-cols-12 items-center px-4 sm:px-6 py-3 hover:bg-slate-900/40 transition"
          :class="{ 'bg-amber-500/10 border-l-4 border-amber-400': player.isHuman }"
        >
          <!-- Nickname & Avatar -->
          <div class="col-span-6 flex items-center gap-3">
            <img
              :src="player.avatar"
              :alt="player.name"
              class="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0 shadow-sm"
            />
            <div class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                {{ player.name }}
                <span v-if="player.isHuman" class="text-[10px] text-amber-400 font-semibold ml-1">(我)</span>
              </span>
              <span v-if="player.personality" class="text-[9px] text-slate-400 mt-0.5">
                {{ player.personality }}
              </span>
            </div>
          </div>

          <!-- Total Buy-in -->
          <div class="col-span-3 text-right text-xs font-mono font-semibold text-slate-300">
            {{ player.totalBuyIn.toLocaleString() }}
          </div>

          <!-- Net Profit / Loss -->
          <div class="col-span-3 text-right text-xs md:text-sm font-mono font-black">
            <span
              :class="
                player.netProfit > 0
                  ? 'text-rose-400'
                  : player.netProfit < 0
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              "
            >
              {{ player.netProfit > 0 ? `+${player.netProfit.toLocaleString()}` : player.netProfit.toLocaleString() }}
            </span>
          </div>
        </div>
      </div>

      <!-- Table Stats Panel (matching Image 4) with generous padding -->
      <div class="stats-panel p-4 sm:p-5 md:p-6 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-300">
        <div class="grid grid-cols-2 gap-y-2 gap-x-6 mb-3 pb-3 border-b border-slate-800/80 text-[11px]">
          <div class="flex justify-between items-center">
            <span class="text-slate-400">活跃度积分:</span>
            <span class="font-mono text-slate-300 font-bold">0/0</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">保险总计:</span>
            <span class="font-mono text-slate-300 font-bold">0</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-y-1.5 gap-x-6 font-mono text-[11px]">
          <div class="flex justify-between items-center">
            <span class="text-slate-400">全部流水:</span>
            <span class="text-amber-300 font-bold">{{ totalVolume.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">本局手数:</span>
            <span class="text-slate-200 font-semibold">{{ handCount }}</span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-slate-400">全部带入:</span>
            <span class="text-slate-200">{{ totalBuyIns.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">平均底池:</span>
            <span class="text-slate-200">{{ averagePot.toLocaleString() }}</span>
          </div>

          <div class="flex justify-between items-center">
            <span class="text-slate-400">本局时长:</span>
            <span class="text-slate-200">{{ formattedDuration }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-slate-400">剩余时间:</span>
            <span class="text-slate-200">无限制</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Player } from '../types/poker';

const props = defineProps<{
  isOpen: boolean;
  players: Player[];
  totalVolume: number;
  handCount: number;
  formattedDuration: string;
}>();

defineEmits<{
  (e: 'close'): void;
}>();

const sortedPlayers = computed(() => {
  return [...props.players].sort((a, b) => b.netProfit - a.netProfit);
});

const totalBuyIns = computed(() => {
  return props.players.reduce((sum, p) => sum + p.totalBuyIn, 0);
});

const averagePot = computed(() => {
  if (props.handCount <= 0) return 0;
  return Math.floor(props.totalVolume / Math.max(1, props.handCount));
});
</script>

<style scoped>
.modal-card {
  width: calc(100vw - 16px) !important;
  max-width: 720px !important;
  margin: 0 auto;
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
