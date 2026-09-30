<template>
  <div
    v-if="isOpen"
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="modal-card w-full max-w-[440px] bg-slate-950 border border-amber-500/50 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden relative"
    >
      <!-- Close Button -->
      <button
        @click="$emit('close')"
        class="close-btn absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/90 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer z-10"
      >
        ✕
      </button>

      <!-- Inner Content with generous padding so nothing touches borders -->
      <div class="wallet-content flex flex-col">
        <!-- Header -->
        <div class="wallet-header flex items-center gap-3.5 mb-5 pr-8">
          <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-2xl text-amber-400 shadow-inner shrink-0">
            👛
          </div>
          <div>
            <h2 class="text-base md:text-lg font-bold text-white tracking-wide">筹码钱包</h2>
            <p class="text-xs text-slate-400 mt-0.5">带入比赛筹码 (单次最高 6,000)</p>
          </div>
        </div>

        <!-- Current Balance Card -->
        <div class="balance-card p-4 md:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 mb-5 flex items-center justify-between shadow-inner">
          <div>
            <div class="text-xs text-slate-400 font-medium mb-1.5">当前拥有筹码</div>
            <div class="text-2xl md:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {{ currentChips.toLocaleString() }}
            </div>
          </div>
          <div class="text-right">
            <a-tag :color="currentChips > 6000 ? 'red' : 'green'" size="medium" class="!rounded-lg !font-bold">
              {{ currentChips > 6000 ? '已满额 (不可带入)' : '可带入筹码' }}
            </a-tag>
          </div>
        </div>

        <!-- Restriction Warning if Chips > 6000 -->
        <div
          v-if="currentChips > 6000"
          class="warning-banner p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs mb-5 flex items-start gap-2.5"
        >
          <span class="text-base shrink-0">⚠️</span>
          <div>
            <div class="font-bold text-rose-200">暂不可带入新筹码</div>
            <div class="text-[11px] opacity-90 mt-1 leading-relaxed">
              当前拥有筹码大于 6,000。当在对局中消耗至 6,000 以下即可重新带入。
            </div>
          </div>
        </div>

        <!-- Buy-in Form when allowed using Arco Slider -->
        <div v-else class="buyin-form space-y-4 mb-6">
          <div class="flex justify-between items-center text-xs mb-1">
            <span class="text-slate-300 font-semibold text-sm">带入数量</span>
            <div class="flex items-center gap-1">
              <span class="text-amber-400 font-mono font-black text-lg">{{ buyInAmount.toLocaleString() }}</span>
              <span class="text-[11px] text-amber-300/80">筹码</span>
            </div>
          </div>

          <!-- Arco Slider with generous horizontal padding so slider marks don't touch border -->
          <div class="slider-wrapper px-3 py-2">
            <a-slider
              v-model="buyInAmount"
              :min="200"
              :max="6000"
              :step="200"
              :marks="{ 1200: '1.2k', 3000: '3k', 6000: '6k' }"
            />
          </div>

          <!-- Quick Select Buttons with clean grid and comfortable padding -->
          <div class="grid grid-cols-4 gap-2.5 pt-3">
            <button
              v-for="amt in [1200, 2400, 4000, 6000]"
              :key="amt"
              type="button"
              @click="buyInAmount = amt"
              class="py-2 px-1 rounded-xl border text-xs font-black transition cursor-pointer active:scale-95 shadow-sm"
              :class="
                buyInAmount === amt
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              "
            >
              +{{ amt }}
            </button>
          </div>
        </div>

        <!-- Action Buttons using Arco Buttons -->
        <div class="modal-actions flex items-center gap-3.5 pt-2">
          <a-button
            @click="$emit('close')"
            size="large"
            class="flex-1 !rounded-xl !h-11 !font-bold"
          >
            取消
          </a-button>

          <a-button
            type="primary"
            size="large"
            @click="confirmBuyIn"
            :disabled="currentChips > 6000"
            class="flex-1 !rounded-xl !h-11 !bg-gradient-to-r !from-amber-400 !via-amber-500 !to-yellow-500 !text-slate-950 !font-black !border-0 shadow-lg cursor-pointer"
          >
            确认带入
          </a-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  currentChips: number;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'buyin', amount: number): void;
}>();

const buyInAmount = ref<number>(1200);

function confirmBuyIn() {
  if (props.currentChips > 6000) return;
  emit('buyin', buyInAmount.value);
  emit('close');
}
</script>

<style scoped>
.modal-card {
  width: 92% !important;
  max-width: 440px !important;
  margin: 0 auto;
}

.wallet-content {
  padding: 26px 28px 28px 28px !important;
}

@media (min-width: 768px) {
  .wallet-content {
    padding: 30px 34px 34px 34px !important;
  }
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
