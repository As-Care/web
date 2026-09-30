<template>
  <div
    v-if="isOpen"
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-0 bg-black/80 backdrop-blur-md animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="modal-card bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
    >
      <!-- Header with generous padding -->
      <div
        class="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-800/80 bg-slate-900/70 flex items-center justify-between shrink-0"
      >
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-sm sm:text-base font-bold text-white tracking-wide">
              牌局回顾
            </h2>
            <span
              v-if="currentHand"
              class="text-[10px] sm:text-xs text-amber-400/80 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
            >
              第 {{ currentHand.handNumber }} 手
            </span>
          </div>
          <div
            v-if="currentHand"
            class="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] sm:text-xs text-slate-400 mt-1"
          >
            <span>📅 {{ currentHand.timestamp }}</span>
            <span>•</span>
            <span
              >盲注: {{ currentHand.blinds?.small ?? 0 }}/{{
                currentHand.blinds?.big ?? 0
              }}</span
            >
            <span>•</span>
            <span class="text-amber-400 font-bold"
              >总底池: {{ (currentHand.totalPot ?? 0).toLocaleString() }}</span
            >
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            @click="$emit('close')"
            class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>
      </div>

      <!-- Body / Player List with generous padding -->
      <div class="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 sm:space-y-3">
        <div
          v-if="!currentHand"
          class="py-16 text-center text-slate-500 text-sm"
        >
          暂无已完结的牌局记录，快开始一把对局吧！
        </div>

        <template v-else>
          <!-- Community Cards at Showdown -->
          <div
            v-if="
              currentHand.communityCards &&
              currentHand.communityCards.length > 0
            "
            class="p-3 px-3.5 sm:p-4 sm:px-5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between shadow-sm mb-2.5"
          >
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-slate-300">公共牌:</span>
              <span class="text-[10px] text-slate-500 font-mono"
                >({{ currentHand.communityCards.length }})</span
              >
            </div>
            <div class="flex gap-1.5 sm:gap-2">
              <CardView
                v-for="(card, idx) in currentHand.communityCards"
                :key="`${card.suit}-${card.rank}-${idx}`"
                :card="card"
                size="sm"
              />
            </div>
          </div>

          <!-- Player Result Rows -->
          <div
            v-for="record in currentHand.players"
            :key="record.id"
            class="player-record-row p-2.5 px-3 sm:p-3.5 sm:px-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-2 sm:gap-3 transition hover:bg-slate-900 shadow-sm"
            :class="{
              'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]':
                record.isWinner,
            }"
          >
            <!-- Player Avatar & Name -->
            <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div class="relative shrink-0">
                <img
                  :src="record.avatar"
                  class="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-700 shadow-sm"
                />
                <span
                  v-if="record.positionName"
                  class="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[8px] font-bold text-white bg-indigo-600 shadow"
                >
                  {{ record.positionName.slice(0, 2) }}
                </span>
              </div>
              <div class="flex flex-col min-w-0">
                <span
                  class="text-xs font-bold text-slate-200 truncate max-w-[85px] sm:max-w-[120px]"
                >
                  {{ record.name }}
                </span>
                <span class="text-[10px] text-slate-400 mt-0.5 truncate">
                  {{ record.actionText }}
                </span>
              </div>
            </div>

            <!-- Player Hole Cards & Hand Rank -->
            <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <div class="flex gap-1 sm:gap-1.5">
                <template v-if="record.cards && record.cards.length === 2">
                  <CardView
                    :key="`${record.id}-c0`"
                    :card="record.cards[0]"
                    size="xs"
                  />
                  <CardView
                    :key="`${record.id}-c1`"
                    :card="record.cards[1]"
                    size="xs"
                  />
                </template>
              </div>

              <!-- Hand Evaluation Rank -->
              <span
                v-if="record.handRankName"
                class="hidden sm:inline-block text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700 max-w-[90px] truncate"
              >
                {{ record.handRankName }}
              </span>
            </div>

            <!-- Net Win / Loss -->
            <div class="text-right shrink-0 min-w-[65px] sm:min-w-[75px] pl-1">
              <div
                class="font-mono text-xs sm:text-sm font-black whitespace-nowrap"
                :class="
                  (record.profit ?? 0) > 0
                    ? 'text-amber-400'
                    : (record.profit ?? 0) < 0
                      ? 'text-slate-400'
                      : 'text-slate-500'
                "
              >
                {{
                  (record.profit ?? 0) > 0
                    ? `+${(record.profit ?? 0).toLocaleString()}`
                    : (record.profit ?? 0).toLocaleString()
                }}
              </div>
              <span
                v-if="record.isWinner"
                class="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] border border-amber-500/30"
              >
                获胜
              </span>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer Hand Pagination: 翻页 1/10 格式，上一页、下一页按钮 -->
      <div
        v-if="history && history.length > 0"
        class="px-4 py-3 sm:px-6 sm:py-3.5 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between shrink-0 select-none"
      >
        <!-- 上一页按钮 -->
        <button
          type="button"
          @click="prevHand"
          :disabled="selectedHandIndex <= 0"
          class="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition shadow-sm"
          :class="
            selectedHandIndex <= 0
              ? 'bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed opacity-50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 cursor-pointer hover:text-white'
          "
        >
          <span class="text-[10px]">◀</span>
          <span>上一页</span>
        </button>

        <!-- 翻页指示器: 1/10 格式 -->
        <div class="flex items-center gap-2">
          <div
            class="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800/90 text-xs font-mono font-bold flex items-center gap-1 shadow-inner"
          >
            <span class="text-amber-400 text-sm font-black">{{
              selectedHandIndex + 1
            }}</span>
            <span class="text-slate-600">/</span>
            <span class="text-slate-300">{{ history.length }}</span>
          </div>
          <span
            v-if="currentHand"
            class="text-[11px] text-slate-400 font-mono hidden xs:inline"
          >
            第 {{ currentHand.handNumber }} 手
          </span>
        </div>

        <!-- 下一页按钮 -->
        <button
          type="button"
          @click="nextHand"
          :disabled="selectedHandIndex >= history.length - 1"
          class="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition shadow-sm"
          :class="
            selectedHandIndex >= history.length - 1
              ? 'bg-slate-900 text-slate-600 border border-slate-800/80 cursor-not-allowed opacity-50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 cursor-pointer hover:text-white'
          "
        >
          <span>下一页</span>
          <span class="text-[10px]">▶</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { HandHistory } from "../types/poker";
import CardView from "./CardView.vue";

const props = defineProps<{
  isOpen: boolean;
  history: HandHistory[];
}>();

defineEmits<{
  (e: "close"): void;
}>();

const selectedHandIndex = ref<number>(0);

watch(
  () => props.history.length,
  (len) => {
    if (len > 0) {
      selectedHandIndex.value = 0; // Default to newest hand (at index 0)
    }
  },
  { immediate: true },
);

const currentHand = computed<HandHistory | null>(() => {
  if (!props.history || props.history.length === 0) return null;
  return props.history[selectedHandIndex.value] || props.history[0] || null;
});

function prevHand() {
  if (selectedHandIndex.value > 0) {
    selectedHandIndex.value -= 1;
  }
}

function nextHand() {
  if (selectedHandIndex.value < props.history.length - 1) {
    selectedHandIndex.value += 1;
  }
}
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
