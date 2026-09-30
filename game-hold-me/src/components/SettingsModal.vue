<template>
  <div
    v-if="isOpen"
    class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 md:p-5 bg-black/85 backdrop-blur-md animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="modal-card w-full max-w-[580px] bg-slate-950 border border-amber-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[92vh]"
    >
      <!-- Modal Header -->
      <div
        class="px-5 py-4 md:px-6 md:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">⚙️</span>
          <div>
            <h2
              class="text-base md:text-lg font-black text-amber-400 tracking-wide"
            >
              牌桌设置与规则
            </h2>
            <p class="text-xs text-slate-400 mt-0.5">
              随时调整人数、盲注级别、人机难度或重置对局
            </p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
        >
          ✕
        </button>
      </div>

      <!-- Modal Body (Scrollable with Arco Design components) -->
      <div class="p-5 md:p-6 overflow-y-auto space-y-4 flex-1 text-slate-200">
        <!-- 1. Player Count (2 ~ 12) with Arco Slider & Radio -->
        <div
          class="setting-item p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-slate-800"
        >
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-white">桌上玩家总数</span>
              <a-tag size="small" color="blue">含你自己 (You)</a-tag>
            </div>
            <span class="text-amber-400 font-mono font-black text-base"
              >{{ localPlayerCount }} 人</span
            >
          </div>

          <div class="px-2 mb-2">
            <a-slider
              v-model="localPlayerCount"
              :min="2"
              :max="12"
              :step="1"
              :marks="{ 2: '2人', 6: '6人', 9: '9人', 12: '12人' }"
            />
          </div>

          <!-- Quick Preset Buttons -->
          <div
            class="grid grid-cols-5 gap-1 sm:gap-2 mt-3 pt-2 border-t border-slate-800/60"
          >
            <button
              v-for="preset in [
                { count: 2, label: '单挑' },
                { count: 6, label: '6人' },
                { count: 8, label: '8人' },
                { count: 9, label: '9人' },
                { count: 12, label: '12人' },
              ]"
              :key="preset.count"
              type="button"
              @click="localPlayerCount = preset.count"
              class="py-1 px-0.5 rounded-xl border text-center transition-all duration-150 cursor-pointer text-xs"
              :class="
                localPlayerCount === preset.count
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-slate-500 font-medium'
              "
            >
              {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- 2. Blinds Slider with Arco Slider -->
        <div
          class="setting-item p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-slate-800"
        >
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-white">盲注级别</span>
              <a-tag size="small" color="purple">20/40 ~ 200/400</a-tag>
            </div>
            <span
              class="text-amber-400 font-mono font-black text-base whitespace-nowrap"
              >{{ localSmallBlind }} / {{ localBigBlind }}</span
            >
          </div>

          <div class="px-2">
            <a-slider
              v-model="localSmallBlind"
              :min="20"
              :max="200"
              :step="10"
              :marks="{ 20: '20/40', 100: '100/200', 200: '200/400' }"
              @change="onSmallBlindChange"
            />
          </div>

          <!-- Quick Blind Pills -->
          <div
            class="grid grid-cols-4 gap-1.5 mt-3 pt-2 border-t border-slate-800/60"
          >
            <button
              v-for="b in [
                { sb: 20, bb: 40 },
                { sb: 50, bb: 100 },
                { sb: 100, bb: 200 },
                { sb: 200, bb: 400 },
              ]"
              :key="b.sb"
              type="button"
              @click="
                localSmallBlind = b.sb;
                onSmallBlindChange(b.sb);
              "
              class="py-1 px-1 rounded-xl border text-center transition-all duration-150 cursor-pointer text-xs"
              :class="
                localSmallBlind === b.sb
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                  : 'bg-slate-900/90 text-slate-300 border-slate-700/80 hover:border-slate-500 font-medium'
              "
            >
              {{ b.sb }}/{{ b.bb }}
            </button>
          </div>
        </div>

        <!-- 3. AI Bot Configuration with Arco Input & Arco Select -->
        <div
          class="setting-item p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-slate-800"
        >
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="text-sm font-bold text-white"
                >人机名字与打法难度</span
              >
              <span class="text-[11px] text-slate-400 block mt-0.5"
                >默认人机1、人机2...，可重命名与调整难度</span
              >
            </div>
            <a-tag color="orangered" size="small"
              >{{ localPlayerCount - 1 }} 个对手</a-tag
            >
          </div>

          <!-- Personality Legend Tags -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2.5">
            <a-tag color="red" bordered class="justify-center">🔥 激进哥</a-tag>
            <a-tag color="gold" bordered class="justify-center"
              >👀 非要看</a-tag
            >
            <a-tag color="blue" bordered class="justify-center"
              >🛡️ 紧紧哥</a-tag
            >
            <a-tag color="green" bordered class="justify-center">🐟 大鱼</a-tag>
          </div>

          <!-- Bot Rows -->
          <div class="bot-list space-y-2 max-h-48 overflow-y-auto pr-1">
            <div
              v-for="(bot, idx) in activeBots"
              :key="idx"
              class="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
            >
              <!-- Avatar & Arco Input -->
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <span
                  class="text-xs font-mono font-bold text-amber-400 w-5 text-center"
                  >#{{ idx + 1 }}</span
                >
                <a-input
                  v-model="bot.name"
                  placeholder="人机名称"
                  size="small"
                  :max-length="8"
                  allow-clear
                  class="max-w-[140px]"
                >
                  <template #prefix>
                    <span class="text-[10px] text-slate-500">🤖</span>
                  </template>
                </a-input>
              </div>

              <!-- Arco Select for Personality -->
              <div class="w-40">
                <a-select v-model="bot.personality" size="small">
                  <a-option value="激进哥">
                    <span class="text-red-400 font-bold">🔥 激进哥</span>
                  </a-option>
                  <a-option value="非要看">
                    <span class="text-amber-400 font-bold">👀 非要看</span>
                  </a-option>
                  <a-option value="紧紧哥">
                    <span class="text-blue-400 font-bold">🛡️ 紧紧哥</span>
                  </a-option>
                  <a-option value="大鱼">
                    <span class="text-emerald-400 font-bold">🐟 大鱼</span>
                  </a-option>
                </a-select>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Table Felt Theme with Arco Radio Group -->
        <div
          class="setting-item p-4 md:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
        >
          <span class="text-sm font-bold text-white">桌布质感</span>
          <a-radio-group v-model="localTheme" type="button" size="small">
            <a-radio value="burgundy">红龙酒红</a-radio>
            <a-radio value="emerald">尊爵翡翠</a-radio>
            <a-radio value="midnight">曜石黑金</a-radio>
          </a-radio-group>
        </div>
      </div>

      <!-- Modal Footer with Arco Button -->
      <div
        class="px-5 py-4 md:px-6 md:py-4.5 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950"
      >
        <a-button @click="$emit('close')" class="!rounded-xl !h-10">
          取消
        </a-button>

        <a-button
          type="primary"
          @click="confirmAndSave"
          class="flex-1 !h-10 !rounded-xl !bg-gradient-to-r !from-amber-400 !via-amber-500 !to-yellow-500 !text-slate-950 !font-black !border-0 shadow-lg cursor-pointer"
        >
          保存设置并重置牌桌
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { BotPersonality, Player, TableConfig } from "../types/poker";

const props = defineProps<{
  isOpen: boolean;
  config: TableConfig;
  players: Player[];
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (
    e: "save-and-start",
    data: {
      playerCount: number;
      smallBlind: number;
      bigBlind: number;
      theme: "burgundy" | "emerald" | "midnight";
      bots: { name: string; personality: BotPersonality }[];
    },
  ): void;
}>();

const localPlayerCount = ref<number>(props.config.playerCount || 8);
const localSmallBlind = ref<number>(props.config.smallBlind || 20);
const localBigBlind = computed(() => localSmallBlind.value * 2);
const localTheme = ref<"burgundy" | "emerald" | "midnight">(
  (props.config.theme as "burgundy" | "emerald" | "midnight") || "emerald",
);

function onSmallBlindChange(val: any) {
  localSmallBlind.value = Number(val);
}

interface EditableBot {
  name: string;
  personality: BotPersonality;
}

const botList = ref<EditableBot[]>([]);

function initDefaultBots() {
  const defaultBots = [
    { name: "谭轩", personality: "激进哥" as BotPersonality },
    { name: "JJE", personality: "非要看" as BotPersonality },
    { name: "Yara", personality: "紧紧哥" as BotPersonality },
    { name: "臧书奴", personality: "大鱼" as BotPersonality },
    { name: "ST Wang", personality: "激进哥" as BotPersonality },
    { name: "Elton", personality: "非要看" as BotPersonality },
    { name: "维克托", personality: "紧紧哥" as BotPersonality },
    { name: "布兰妮", personality: "大鱼" as BotPersonality },
    { name: "李四", personality: "激进哥" as BotPersonality },
    { name: "王五", personality: "非要看" as BotPersonality },
    { name: "赵六", personality: "紧紧哥" as BotPersonality },
  ];
  botList.value = defaultBots.map((b) => ({ ...b }));
}

initDefaultBots();

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      localPlayerCount.value = props.config.playerCount;
      localSmallBlind.value = props.config.smallBlind;
      localTheme.value = props.config.theme as
        | "burgundy"
        | "emerald"
        | "midnight";

      const bots = props.players.filter((p) => !p.isHuman);
      if (bots.length > 0) {
        bots.forEach((b, idx) => {
          if (botList.value[idx]) {
            botList.value[idx].name = b.name;
            if (b.personality) botList.value[idx].personality = b.personality;
          }
        });
      }
    }
  },
);

const activeBots = computed(() => {
  const needed = localPlayerCount.value - 1;
  return botList.value.slice(0, needed);
});

function confirmAndSave() {
  emit("save-and-start", {
    playerCount: localPlayerCount.value,
    smallBlind: localSmallBlind.value,
    bigBlind: localBigBlind.value,
    theme: localTheme.value,
    bots: activeBots.value.map((b) => ({
      name: b.name.trim() || "人机",
      personality: b.personality,
    })),
  });
  emit("close");
}
</script>

<style scoped>
.modal-card {
  width: 94% !important;
  max-width: 600px !important;
  max-height: 90vh;
  margin: 0 auto;
}

.setting-item {
  padding: 16px 18px !important;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bot-list {
  max-height: 195px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 6px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bot-list::-webkit-scrollbar {
  width: 5px;
}
.bot-list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 4px;
}
.bot-list::-webkit-scrollbar-thumb {
  background: rgba(245, 158, 11, 0.45);
  border-radius: 4px;
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
