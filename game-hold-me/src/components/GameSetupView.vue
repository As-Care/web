<template>
  <div
    class="game-setup-screen w-full h-full flex flex-col items-center justify-start sm:justify-center p-0 sm:p-4 md:p-8 overflow-y-auto select-none"
  >
    <!-- Center Setup Card -->
    <div
      class="setup-card bg-slate-950 border-0 sm:border border-amber-500/40 rounded-none sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col my-0 sm:my-auto"
    >
      <!-- Card Header with robust scoped padding -->
      <div
        class="card-header border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 flex items-center justify-between shrink-0"
      >
        <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div
            class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-sm sm:text-base shadow-inner text-amber-400 shrink-0"
          >
            ♠
          </div>
          <div class="min-w-0 flex-1">
            <div class="card-main-title flex items-center gap-1.5 flex-wrap">
              <span>德州扑克俱乐部</span>
              <span class="text-[10px] text-amber-400/90 font-medium bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30">开局配置</span>
            </div>
            <p class="card-subtitle text-[10px] sm:text-xs text-slate-400 mt-0.5 truncate">
              自定义对手人数、盲注与人机难度
            </p>
          </div>
        </div>

        <a-tag color="gold" bordered size="small" class="!font-bold shrink-0 ml-2 text-[10px] sm:text-xs">
          玩家：You
        </a-tag>
      </div>

      <!-- Scrollable Form Body -->
      <div class="setup-scrollable-content overflow-y-auto">
        <div class="setup-body">
          <!-- 1. Player Count (2 ~ 12) with Arco Slider & Radio -->
          <div class="setting-block">
            <div class="setting-header">
              <div class="flex items-center gap-1.5 sm:gap-2">
                <span class="setting-title">桌上玩家总数</span>
                <a-tag size="small" color="blue" class="text-[10px] sm:text-xs">含你自己 (You)</a-tag>
              </div>
              <span class="setting-value"
                >{{ localPlayerCount }} 人</span
              >
            </div>

            <div class="slider-container">
              <a-slider
                v-model="localPlayerCount"
                :min="2"
                :max="12"
                :step="1"
                :marks="{ 2: '2人', 6: '6人', 9: '9人', 12: '12人' }"
              />
            </div>

            <!-- Quick Preset Buttons -->
            <div class="preset-row pt-2 border-t border-slate-800/80">
              <a-radio-group
                v-model="localPlayerCount"
                type="button"
                size="small"
                class="w-full flex-preset-group"
              >
                <a-radio :value="2">单挑</a-radio>
                <a-radio :value="6">6人桌</a-radio>
                <a-radio :value="8">8人桌</a-radio>
                <a-radio :value="9">9人桌</a-radio>
                <a-radio :value="12">12人</a-radio>
              </a-radio-group>
            </div>
          </div>

          <!-- 2. Blinds Slider (20/40 ~ 200/400) with Arco Slider -->
          <div class="setting-block">
            <div class="setting-header">
              <span class="setting-title"
                >盲注级别 (小盲 / 大盲)</span
              >
              <span class="setting-value whitespace-nowrap shrink-0"
                >{{ localSmallBlind }} / {{ localBigBlind }}</span
              >
            </div>

            <div class="slider-container">
              <a-slider
                v-model="localSmallBlind"
                :min="20"
                :max="200"
                :step="10"
                :marks="{
                  20: '20/40',
                  50: '50/100',
                  100: '100/200',
                  150: '150/300',
                  200: '200/400',
                }"
                @change="onSmallBlindChange"
              />
            </div>
          </div>

          <!-- 3. AI Bot Configuration with Max-Height and Y-axis Scroll -->
          <div class="setting-block">
            <div class="setting-header">
              <span class="setting-title"
                >人机名字与打法难度</span
              >
              <a-tag color="orangered" size="small" class="text-[10px] sm:text-xs"
                >{{ localPlayerCount - 1 }} 个对手</a-tag
              >
            </div>

            <!-- Bot Personality Legend Tags -->
            <div
              class="legend-grid grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5 pb-1 text-[10px]"
            >
              <a-tag color="red" bordered class="justify-center legend-tag"
                >🔥 激进哥 (较为激进)</a-tag
              >
              <a-tag color="gold" bordered class="justify-center legend-tag"
                >👀 非要看 (必须看3张)</a-tag
              >
              <a-tag color="blue" bordered class="justify-center legend-tag"
                >🛡️ 紧紧哥 (打法较紧)</a-tag
              >
              <a-tag color="green" bordered class="justify-center legend-tag"
                >🐟 大鱼 (纯新手水平)</a-tag
              >
            </div>

            <!-- Bot Rows with Fixed Max-Height and Scrollable Y-axis -->
            <div class="bot-list">
              <div v-for="(bot, idx) in activeBots" :key="idx" class="bot-row">
                <!-- Avatar & Arco Input -->
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                  <span
                    class="text-xs font-mono font-bold text-amber-400 w-6 text-center"
                    >#{{ idx + 1 }}</span
                  >
                  <a-input
                    v-model="bot.name"
                    placeholder="人机名称"
                    size="small"
                    :max-length="8"
                    allow-clear
                    class="bot-name-input"
                  >
                    <template #prefix>
                      <span class="text-xs">🤖</span>
                    </template>
                  </a-input>
                </div>

                <!-- Arco Select for Personality -->
                <div class="bot-select-wrap">
                  <a-select
                    v-model="bot.personality"
                    size="small"
                    class="w-full"
                  >
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

          <!-- 4. Table Felt Theme -->
          <div class="setting-block theme-block">
            <span class="text-xs sm:text-sm font-semibold text-white">桌布质感</span>
            <a-radio-group v-model="localTheme" type="button" size="small">
              <a-radio value="burgundy">红龙酒红</a-radio>
              <a-radio value="emerald">尊爵翡翠</a-radio>
              <a-radio value="midnight">曜石黑金</a-radio>
            </a-radio-group>
          </div>
        </div>
      </div>

      <!-- Card Footer with Prominent "开始游戏" Button -->
      <div
        class="card-footer border-t border-slate-800 bg-slate-950 flex flex-col gap-2"
      >
        <a-button
          type="primary"
          size="medium"
          long
          @click="confirmAndStart"
          class="start-play-btn font-bold text-sm sm:text-base tracking-wide shadow-[0_0_20px_rgba(245,158,11,0.4)] !h-11 sm:!h-12 !rounded-xl sm:!rounded-2xl !bg-gradient-to-r !from-amber-400 !via-amber-500 !to-yellow-500 !text-slate-950 !border-0 cursor-pointer"
        >
          <template #icon>
            <span class="text-base sm:text-lg">▶</span>
          </template>
          开始游戏 (发牌入局)
        </a-button>

        <p class="text-center text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
          初始筹码 1,200 • 局内右上角钱包可带入最多 6,000 筹码 • 每手思考时间 20s (+10s延时)
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { BotPersonality, TableConfig } from "../types/poker";

const props = defineProps<{
  config: TableConfig;
}>();

const emit = defineEmits<{
  (
    e: "start",
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
  (props.config.theme as "burgundy" | "emerald" | "midnight") || "burgundy",
);

function onSmallBlindChange(val: any) {
  localSmallBlind.value = Number(val);
}

interface EditableBot {
  name: string;
  personality: BotPersonality;
}

const botList = ref<EditableBot[]>([
  { name: "谭轩", personality: "激进哥" },
  { name: "JJE", personality: "非要看" },
  { name: "Yara", personality: "紧紧哥" },
  { name: "臧书奴", personality: "大鱼" },
  { name: "ST Wang", personality: "激进哥" },
  { name: "Elton", personality: "非要看" },
  { name: "维克托", personality: "紧紧哥" },
  { name: "布兰妮", personality: "大鱼" },
  { name: "李四", personality: "激进哥" },
  { name: "王五", personality: "非要看" },
  { name: "赵六", personality: "紧紧哥" },
]);

const activeBots = computed(() => {
  const needed = localPlayerCount.value - 1;
  return botList.value.slice(0, needed);
});

function confirmAndStart() {
  emit("start", {
    playerCount: localPlayerCount.value,
    smallBlind: localSmallBlind.value,
    bigBlind: localBigBlind.value,
    theme: localTheme.value,
    bots: activeBots.value.map((b) => ({
      name: b.name.trim() || "人机",
      personality: b.personality,
    })),
  });
}
</script>

<style scoped>
.game-setup-screen {
  background: radial-gradient(
    circle at 50% 30%,
    #151824 0%,
    #080a0f 70%,
    #020306 100%
  );
}

.setup-card {
  width: 94%;
  max-width: 640px;
  max-height: 92vh;
  margin: auto;
  box-shadow:
    0 25px 60px rgba(0, 0, 0, 0.95),
    0 0 40px rgba(245, 158, 11, 0.15);
}

.setup-scrollable-content {
  flex: 1;
  overflow-y: auto;
}

.setup-scrollable-content::-webkit-scrollbar {
  width: 6px;
}
.setup-scrollable-content::-webkit-scrollbar-thumb {
  background: rgba(245, 158, 11, 0.3);
  border-radius: 4px;
}

.card-header {
  padding: 20px 28px !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.setup-body {
  padding: 20px 28px !important;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-sizing: border-box;
}

.card-footer {
  padding: 16px 28px 24px 28px !important;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
}

/* Explicit Setting Block Styling with Ample Padding */
.setting-block {
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(51, 65, 85, 0.6);
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.setting-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-container {
  padding: 6px 12px 14px 12px;
}

.preset-row :deep(.arco-radio-group) {
  display: flex !important;
  width: 100% !important;
}

.preset-row :deep(.arco-radio-button) {
  flex: 1 !important;
  text-align: center !important;
  padding: 0 4px !important;
  font-size: 11px !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.theme-block {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
}

/* Bot List Max Height & Y-axis Scroll */
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
.bot-list::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 158, 11, 0.8);
}

.bot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  background: rgba(2, 6, 23, 0.85);
  border: 1px solid rgba(30, 41, 59, 0.85);
  border-radius: 12px;
  transition: all 0.2s;
}

.bot-row:hover {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(15, 23, 42, 0.95);
}

.card-main-title {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #fbbf24 !important;
  line-height: 1.25 !important;
}

.card-subtitle {
  font-size: 11px !important;
  color: #94a3b8 !important;
  margin-top: 2px !important;
}

.setting-title {
  font-size: 13px !important;
  font-weight: 600 !important;
  color: #f1f5f9 !important;
}

.setting-value {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #fbbf24 !important;
  font-family: monospace !important;
}

.legend-tag {
  font-size: 10px !important;
  padding: 0 4px !important;
  height: 22px !important;
  line-height: 20px !important;
}

.bot-name-input {
  max-width: 140px;
}

.bot-select-wrap {
  width: 150px;
}

.start-play-btn:hover {
  filter: brightness(1.08);
}

/* Mobile full-screen responsive optimization */
@media (max-width: 640px) {
  .game-setup-screen {
    padding: 0 !important;
    justify-content: flex-start !important;
  }

  .setup-card {
    width: 100% !important;
    max-width: 100% !important;
    height: 100% !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    border: none !important;
    border-radius: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
  }

  .card-main-title {
    font-size: 13px !important;
  }

  .card-subtitle {
    font-size: 10px !important;
  }

  .setting-title {
    font-size: 12px !important;
  }

  .setting-value {
    font-size: 13px !important;
  }

  .card-header {
    padding: 10px 12px !important;
  }

  .setup-body {
    padding: 8px 10px 14px 10px !important;
    gap: 8px !important;
  }

  .setting-block {
    padding: 10px 10px !important;
    border-radius: 12px !important;
    gap: 6px !important;
  }

  .slider-container {
    padding: 2px 4px 6px 4px !important;
  }

  .theme-block {
    padding: 8px 10px !important;
  }

  .bot-select-wrap {
    width: 120px !important;
  }

  .card-footer {
    padding: 8px 12px max(12px, env(safe-area-inset-bottom, 12px)) 12px !important;
  }
}
</style>
