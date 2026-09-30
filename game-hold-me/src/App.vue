<template>
  <div class="app-root w-full h-full flex flex-col bg-[#07090e] text-slate-100 select-none overflow-hidden font-sans">
    <!-- 1. Pre-game Setup Screen (Arco Design Components, Zero background flash) -->
    <GameSetupView
      v-if="!isGameStarted"
      :config="config"
      @start="handleGameStart"
    />

    <!-- 2. Active Game Screen (Revealed once "开始游戏" is clicked, strictly 100vh/100dvh on mobile) -->
    <div v-else class="game-screen-wrapper w-full h-full max-h-[100dvh] flex items-center justify-center p-0 md:p-2.5 overflow-hidden animate-fade-in">
      <div class="game-console-stage w-full max-w-[1440px] h-full max-h-[100dvh] md:max-h-[94vh] flex flex-col justify-between my-auto overflow-hidden">
        <!-- Top Navigation Bar -->
        <!-- Top Navigation Bar (Clean & streamlined for mobile) -->
        <header class="top-nav-bar flex items-center justify-between px-2.5 md:px-6 py-1.5 md:py-2 bg-slate-950/90 border-b md:border border-slate-800/80 rounded-none md:rounded-2xl backdrop-blur-md z-30 shadow-md">
          <!-- Left Controls: Menu & History & Table Meta -->
          <div class="flex items-center gap-2">
            <!-- Menu / Quick Actions Button -->
            <button
              @click="isMobileMenuOpen = true"
              class="nav-btn w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition shadow-sm cursor-pointer"
              title="游戏菜单与设置"
            >
              <span class="text-sm md:text-base">☰</span>
            </button>

            <!-- 牌局回顾 Button (Desktop / Tablet) -->
            <button
              @click="isHistoryOpen = true"
              class="hidden md:flex nav-btn relative w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white items-center justify-center transition shadow-sm cursor-pointer group"
              title="牌局回顾"
            >
              <!-- History Replay Clock SVG Icon -->
              <svg
                class="w-4 h-4 text-slate-300 group-hover:text-amber-400 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              <!-- 灰白色数字角标 -->
              <span
                v-if="history.length > 0"
                class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-slate-200 text-slate-900 border border-slate-300 text-[9px] font-extrabold flex items-center justify-center shadow-sm select-none"
              >
                {{ history.length > 9 ? '9+' : history.length }}
              </span>
            </button>

            <!-- Table Meta Details -->
            <div class="flex items-center gap-1.5 ml-0.5">
              <span class="text-xs font-bold text-amber-400">德州扑克</span>
              <span class="text-[10px] text-slate-400 font-mono">盲注 {{ config.smallBlind }}/{{ config.bigBlind }}</span>
            </div>
          </div>

          <!-- Right Controls: Skip Hand, Wallet, Sound, Settings, Rank, Lobby -->
          <div class="flex items-center gap-1.5 sm:gap-2 md:gap-2.5">
            <!-- 1. 跳过这一把，开始下一把 Button -->
            <button
              @click="handleSkipHand"
              class="skip-btn flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition shadow-sm active:scale-95 cursor-pointer text-[11px] md:text-xs font-bold"
              title="立即跳过本手，开始下一把对局"
            >
              <span>⏩</span>
              <span class="hidden md:inline whitespace-nowrap">跳过这一把，开始下一把</span>
              <span class="md:hidden whitespace-nowrap">跳过本把</span>
            </button>

            <!-- 2. Wallet Modal Button (带入筹码) -->
            <button
              @click="isWalletOpen = true"
              class="wallet-nav-btn flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition shadow-sm active:scale-95 cursor-pointer"
              title="点击打开筹码钱包"
            >
              <span class="text-xs md:text-sm">👛</span>
              <span class="text-[11px] md:text-xs font-bold font-mono">{{ hero?.chips.toLocaleString() ?? '1,200' }}</span>
            </button>

            <!-- 3. Desktop only buttons -->
            <button
              @click="toggleSound"
              class="hidden md:flex nav-btn w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white items-center justify-center transition shadow-sm cursor-pointer"
              :title="isMuted ? '开启音效' : '静音'"
            >
              <span>{{ isMuted ? '🔇' : '🔊' }}</span>
            </button>

            <button
              @click="isSettingsOpen = true"
              class="hidden md:flex nav-btn w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white items-center justify-center transition shadow-sm cursor-pointer"
              title="牌桌与人机设置"
            >
              <span class="text-base">👥</span>
            </button>

            <button
              @click="isLeaderboardOpen = true"
              class="hidden md:flex nav-btn w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white items-center justify-center transition shadow-sm cursor-pointer"
              title="实时排名"
            >
              <span class="text-base">🏆</span>
            </button>

            <!-- 4. 返回大厅 Button -->
            <button
              @click="handleReturnToLobby"
              class="lobby-btn flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-slate-300 hover:text-white transition shadow-sm active:scale-95 cursor-pointer text-xs font-bold"
              title="返回大厅配置界面"
            >
              <span>🏛️</span>
              <span class="hidden sm:inline">大厅</span>
            </button>
          </div>
        </header>

        <!-- Main Game Felt Table Area -->
        <main class="main-table-container flex-1 relative flex items-center justify-center overflow-hidden my-1">
          <PokerTable
            :players="players"
            :community-cards="communityCards"
            :total-pot="totalPot"
            :pots="pots"
            :stage="stage"
            :active-player-index="activePlayerIndex"
            :dealer-index="dealerIndex"
            :config="config"
            :hand-number="handNumber"
            :turn-time-remaining="turnTimeRemaining"
            :turn-total-time="turnTotalTime"
            :winning-cards="winningCommunityCards"
            :is-dealing="isDealing"
            :is-all-in-runout="isAllInRunout"
            :winners="showdownWinners"
            :is-hero-turn="isHeroTurn"
            @start-hand="startHand"
            @open-settings="isSettingsOpen = true"
            @extend-time="applyTimeExtension"
          />

          <!-- Showdown Victory Overlay -->
          <ShowdownOverlay
            :show="isShowdownActive"
            :winners="showdownWinners"
            @next-hand="startHand"
          />
        </main>

        <!-- PC Bottom Action Drawer (Centered below the table, fixed height on desktop, exactly as before) -->
        <footer
          v-if="!isMobile"
          key="pc-action-footer"
          class="action-footer px-5 py-1.5 h-[86px] min-h-[86px] max-h-[86px] bg-slate-950/95 border border-slate-800/90 rounded-2xl backdrop-blur-md z-30 flex items-center justify-center shrink-0 w-full"
        >
          <div class="flex items-center justify-center mx-auto">
            <!-- Action Control Bar (Centered) -->
            <div class="flex items-center justify-center">
              <ActionBar
                key="pc-action-bar"
                :is-hero-turn="isHeroTurn"
                :is-hand-active="stage !== 'idle' && stage !== 'ended'"
                :is-hero-folded="hero?.hasFolded ?? false"
                :call-amount="heroCallAmount"
                :current-highest-bet="currentHighestBet"
                :min-raise-amount="heroMinRaise"
                :hero-chips="hero?.chips ?? 0"
                :total-pot="totalPot"
                :big-blind="config.bigBlind"
                :turn-time-remaining="turnTimeRemaining"
                :turn-total-time="turnTotalTime"
                :extensions-used="hero?.extensionsUsed ?? 0"
                v-model:auto-check-or-fold="autoCheckOrFold"
                v-model:auto-check="autoCheck"
                v-model:auto-call-any="autoCallAny"
                @act="handlePlayerAction"
                @extend-time="applyTimeExtension"
              />
            </div>
          </div>
        </footer>

        <!-- Mobile Floating Action Overlay (Only on mobile, zero impact on PC) -->
        <div
          v-else
          key="mobile-action-overlay"
          class="fixed inset-0 pointer-events-none z-30"
        >
          <ActionBar
            key="mobile-action-bar"
            :is-hero-turn="isHeroTurn"
            :is-hand-active="stage !== 'idle' && stage !== 'ended'"
            :is-hero-folded="hero?.hasFolded ?? false"
            :call-amount="heroCallAmount"
            :current-highest-bet="currentHighestBet"
            :min-raise-amount="heroMinRaise"
            :hero-chips="hero?.chips ?? 0"
            :total-pot="totalPot"
            :big-blind="config.bigBlind"
            :turn-time-remaining="turnTimeRemaining"
            :turn-total-time="turnTotalTime"
            :extensions-used="hero?.extensionsUsed ?? 0"
            v-model:auto-check-or-fold="autoCheckOrFold"
            v-model:auto-check="autoCheck"
            v-model:auto-call-any="autoCallAny"
            @act="handlePlayerAction"
            @extend-time="applyTimeExtension"
          />
        </div>
      </div>
    </div>

    <!-- Modals (Active in Game) -->
    <!-- 1. Wallet Modal -->
    <WalletModal
      :is-open="isWalletOpen"
      :current-chips="hero?.chips ?? 0"
      @close="isWalletOpen = false"
      @buyin="handleBuyIn"
    />

    <!-- 2. Settings Modal (Arco Design) -->
    <SettingsModal
      :is-open="isSettingsOpen"
      :config="config"
      :players="players"
      @close="isSettingsOpen = false"
      @save-and-start="handleSaveAndStart"
    />

    <!-- 3. Hand History Modal (牌局回顾) -->
    <HistoryModal
      :key="'history-modal'"
      :is-open="isHistoryOpen"
      :history="history"
      @close="isHistoryOpen = false"
    />

    <!-- 4. Leaderboard Modal (实时排名) -->
    <LeaderboardModal
      :is-open="isLeaderboardOpen"
      :players="players"
      :total-volume="totalVolume"
      :hand-count="handNumber - 1"
      :formatted-duration="formattedGameDuration"
      @close="isLeaderboardOpen = false"
    />

    <!-- 5. Poker Rules & Help Modal -->
    <div
      v-if="isRulesOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      @click.self="isRulesOpen = false"
    >
      <div class="modal-card w-full max-w-[500px] bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 md:p-7 max-h-[85vh] flex flex-col">
        <div class="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">📖</span>
            <h2 class="text-base font-bold text-white tracking-wide">德州扑克规则与牌型说明</h2>
          </div>
          <button @click="isRulesOpen = false" class="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition">
            ✕
          </button>
        </div>

        <div class="overflow-y-auto space-y-3.5 text-xs text-slate-300 pr-1 flex-1">
          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1.5">牌型大小排行 (从大到小)</h3>
            <ol class="list-decimal list-inside space-y-1 text-slate-300">
              <li><strong class="text-white">皇家同花顺</strong> (同花 A-K-Q-J-10)</li>
              <li><strong class="text-white">同花顺</strong> (五张相连且同花色)</li>
              <li><strong class="text-white">四条</strong> (四张同点数牌 + 一张单牌)</li>
              <li><strong class="text-white">葫芦</strong> (三条 + 一对)</li>
              <li><strong class="text-white">同花</strong> (五张同花色任意点数)</li>
              <li><strong class="text-white">顺子</strong> (五张不同花色顺子)</li>
              <li><strong class="text-white">三条</strong> (三张相同点数牌)</li>
              <li><strong class="text-white">两对</strong> (两个不同对子)</li>
              <li><strong class="text-white">一对</strong> (两个相同点数牌)</li>
              <li><strong class="text-white">高牌</strong> (没有任何成牌组合，比最大单牌)</li>
            </ol>
          </div>

          <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <h3 class="font-bold text-amber-400">本局游戏机制与规则</h3>
            <p>• <strong>玩家角色</strong>: 你的名字为 <strong>You</strong>，初始筹码 1,200。</p>
            <p>• <strong>筹码带入</strong>: 右上角钱包单次带入最高 6,000。若当前筹码超过 6,000 则不可带入。</p>
            <p>• <strong>行动倒计时</strong>: 每手初始 20 秒，拥有 1 次延时机会可增加 10 秒。</p>
            <p>• <strong>人机难度</strong>:
              <br/>- 激进哥: 频繁加注、诈唬、推全下。
              <br/>- 非要看: 必须看翻牌3张牌才考虑弃牌。
              <br/>- 紧紧哥: 极紧只打优质强牌。
              <br/>- 大鱼: 纯新手水平，随意跟注。
            </p>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-800 flex justify-end">
          <a-button
            type="primary"
            @click="isRulesOpen = false"
            class="!rounded-xl"
          >
            知道了
          </a-button>
        </div>
      </div>
    </div>

    <!-- Mobile Quick Menu Modal -->
    <div
      v-if="isMobileMenuOpen"
      class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      @click.self="isMobileMenuOpen = false"
    >
      <div class="w-full max-w-xs bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-3">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2">
            <span class="text-amber-400 font-bold text-sm">德州扑克功能菜单</span>
          </div>
          <button
            @click="isMobileMenuOpen = false"
            class="text-slate-400 hover:text-white p-1 rounded-lg text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs">
          <!-- 牌桌设置 -->
          <button
            @click="isSettingsOpen = true; isMobileMenuOpen = false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 active:scale-95 transition cursor-pointer"
          >
            <span class="text-base">👥</span>
            <span>牌桌设置</span>
          </button>

          <!-- 牌局回顾 -->
          <button
            @click="isHistoryOpen = true; isMobileMenuOpen = false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 active:scale-95 transition cursor-pointer relative"
          >
            <svg
              class="w-4 h-4 text-slate-300 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
            <span>牌局回顾</span>
            <span
              v-if="history.length > 0"
              class="ml-auto px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-900 font-extrabold text-[10px] shadow-sm select-none"
            >
              {{ history.length > 9 ? '9+' : history.length }}
            </span>
          </button>

          <!-- 实时排名 -->
          <button
            @click="isLeaderboardOpen = true; isMobileMenuOpen = false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 active:scale-95 transition cursor-pointer"
          >
            <span class="text-base">🏆</span>
            <span>实时排名</span>
          </button>

          <!-- 规则说明 -->
          <button
            @click="isRulesOpen = true; isMobileMenuOpen = false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 active:scale-95 transition cursor-pointer"
          >
            <span class="text-base">📖</span>
            <span>玩法规则</span>
          </button>

          <!-- 声音音效 -->
          <button
            @click="toggleSound"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 active:scale-95 transition cursor-pointer"
          >
            <span class="text-base">{{ isMuted ? '🔇' : '🔊' }}</span>
            <span>{{ isMuted ? '开启音效' : '静音' }}</span>
          </button>

          <!-- 筹码钱包 -->
          <button
            @click="isWalletOpen = true; isMobileMenuOpen = false"
            class="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 active:scale-95 transition cursor-pointer"
          >
            <span class="text-base">👛</span>
            <span>筹码钱包</span>
          </button>
        </div>

        <!-- 退出/返回大厅 -->
        <button
          @click="handleReturnToLobby(); isMobileMenuOpen = false"
          class="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-xs active:scale-95 transition cursor-pointer"
        >
          <span>🏛️</span>
          <span>退出当前对局并返回大厅</span>
        </button>
      </div>
    </div>

    <!-- Toast Notification -->
    <div
      v-if="toastMessage"
      class="toast-message fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-300 font-bold text-xs shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2 whitespace-nowrap"
    >
      <span class="shrink-0 text-sm">🔔</span>
      <span class="whitespace-nowrap">{{ toastMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ActionBar from './components/ActionBar.vue';
import GameSetupView from './components/GameSetupView.vue';
import HistoryModal from './components/HistoryModal.vue';
import LeaderboardModal from './components/LeaderboardModal.vue';
import PokerTable from './components/PokerTable.vue';
import SettingsModal from './components/SettingsModal.vue';
import ShowdownOverlay from './components/ShowdownOverlay.vue';
import WalletModal from './components/WalletModal.vue';
import { usePokerGame } from './composables/usePokerGame';
import type { Card, PlayerAction } from './types/poker';
import { sound } from './utils/sound';

const windowWidth = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
const windowHeight = ref<number>(typeof window !== 'undefined' ? window.innerHeight : 768);

function handleAppResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

onMounted(() => {
  window.addEventListener('resize', handleAppResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleAppResize);
});

const isMobile = computed(() => windowWidth.value < 768 || windowHeight.value > windowWidth.value);

const {
  config,
  players,
  communityCards,
  isDealing,
  stage,
  dealerIndex,
  activePlayerIndex,
  currentHighestBet,
  minRaise,
  totalPot,
  pots,
  handNumber,
  formattedGameDuration,
  history,
  totalVolume,
  hero,
  isHeroTurn,
  turnTimeRemaining,
  turnTotalTime,
  showdownWinners,
  isShowdownActive,
  autoCheckOrFold,
  autoCheck,
  autoCallAny,
  isAllInRunout,
  applyGameSettings,
  buyInChips,
  startHand,
  stopTurnTimer,
  clearAllPendingTimers,
  executeAction,
  applyTimeExtension,
} = usePokerGame();

// Game Lifecycle State
const isGameStarted = ref<boolean>(false);

// Return to lobby/setup lounge
function handleReturnToLobby() {
  clearAllPendingTimers();
  isGameStarted.value = false;
  showToast('已返回大厅');
}

// Skip current hand and immediately start next hand
function handleSkipHand() {
  clearAllPendingTimers();
  startHand();
  showToast('已跳过本手，开始下一局！');
}

// Modals State
const isWalletOpen = ref<boolean>(false);
const isSettingsOpen = ref<boolean>(false);
const isHistoryOpen = ref<boolean>(false);
const isLeaderboardOpen = ref<boolean>(false);
const isRulesOpen = ref<boolean>(false);
const isMuted = ref<boolean>(false);
const isMobileMenuOpen = ref<boolean>(false);

// Toast
const toastMessage = ref<string>('');
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function showToast(msg: string) {
  toastMessage.value = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = '';
  }, 2500);
}

// Sound toggle
function toggleSound() {
  isMuted.value = sound.toggleMute();
  showToast(isMuted.value ? '已静音' : '音效已开启');
}

// Hero Call Amount calculation
const heroCallAmount = computed(() => {
  if (!hero.value) return 0;
  return Math.max(0, currentHighestBet.value - hero.value.currentBet);
});

// Hero Min Raise calculation
const heroMinRaise = computed(() => {
  return currentHighestBet.value + minRaise.value;
});

// Winning community cards for visual highlight
const winningCommunityCards = computed<Card[]>(() => {
  if (!isShowdownActive.value || showdownWinners.value.length === 0) return [];
  const winner = players.value.find((p) => p.id === showdownWinners.value[0]?.id);
  if (!winner || !winner.evaluation) return [];
  return winner.evaluation.best5;
});

function handlePlayerAction(action: PlayerAction, amount: number) {
  if (!hero.value) return;
  executeAction(hero.value, action, amount);
}

function handleBuyIn(amount: number) {
  const res = buyInChips(amount);
  showToast(res.message);
}

// First time Start Game from Setup Lounge
function handleGameStart(data: any) {
  applyGameSettings(data);
  isGameStarted.value = true;
  showToast('开局配置完成，开始发牌！');
}

// Save settings from in-game modal
function handleSaveAndStart(data: any) {
  applyGameSettings(data);
  isSettingsOpen.value = false;
  showToast('设置已保存并重置牌局');
}
</script>

<style scoped>
.app-root {
  background: radial-gradient(circle at 50% 30%, #151824 0%, #080a0f 70%, #020306 100%);
}

.game-screen-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-console-stage {
  width: 100%;
  max-width: 1440px;
  height: 100%;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin: auto;
}

.top-nav-bar {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.lobby-btn:hover {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.6);
}

.skip-btn:hover {
  background: rgba(245, 158, 11, 0.25);
  border-color: rgba(245, 158, 11, 0.7);
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
}

.action-footer {
  box-shadow: 0 -4px 25px rgba(0, 0, 0, 0.7);
}

@media (max-width: 768px) {
  .game-screen-wrapper {
    height: 100vh !important;
    height: 100dvh !important;
    max-height: 100dvh !important;
    padding: 0 !important;
    overflow: hidden !important;
  }
  .game-console-stage {
    height: 100% !important;
    max-height: 100dvh !important;
    max-width: 100% !important;
    padding: 0 !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    overflow: hidden !important;
  }
  .top-nav-bar {
    border-radius: 0 !important;
    border-left: none !important;
    border-right: none !important;
    border-top: none !important;
    padding: 4px 10px !important;
    flex-shrink: 0 !important;
  }
  .main-table-container {
    flex: 1 1 0% !important;
    min-height: 0 !important;
    overflow: hidden !important;
    margin: 0 !important;
  }
}

.animate-fade-in {
  animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
