<template>
  <div class="action-system w-full select-none">
    <!-- ==================== 1. MOBILE INTERFACE (matching Image 2) ==================== -->
    <template v-if="isMobile">
      <!-- 1.1 When Not Hero's Turn: Pre-action Circular Buttons on Left and Right (matching Image 2) -->
      <div
        v-if="!isHeroTurn && isHandActive && !isHeroFolded"
        key="mobile-pre-actions"
        class="fixed inset-0 pointer-events-none z-30 select-none animate-fade-in"
      >
        <!-- Left Pre-action: 让或弃 (Circular button to the left of cards) -->
        <button
          type="button"
          @click="togglePreAction('checkOrFold')"
          class="absolute pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all active:scale-90 cursor-pointer shadow-lg border-2 select-none"
          :class="
            autoCheckOrFold
              ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_14px_rgba(52,211,153,0.5)] scale-105'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600/70 text-slate-300 backdrop-blur-md'
          "
          style="bottom: 50px; left: calc(50% - 116px); transform: translateX(-50%);"
        >
          <span class="text-[10.5px] font-bold whitespace-nowrap tracking-tight leading-none">让或弃</span>
        </button>

        <!-- Right Pre-action: 跟任何注 (Circular button to the right of cards) -->
        <button
          type="button"
          @click="togglePreAction('callAny')"
          class="absolute pointer-events-auto w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all active:scale-90 cursor-pointer shadow-lg border-2 select-none"
          :class="
            autoCallAny
              ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-[0_0_14px_rgba(52,211,153,0.5)] scale-105'
              : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600/70 text-slate-300 backdrop-blur-md'
          "
          style="bottom: 50px; left: calc(50% + 116px); transform: translateX(-50%);"
        >
          <span class="text-[10px] font-bold whitespace-nowrap tracking-tight leading-none">跟任何注</span>
        </button>
      </div>

      <!-- 1.2 When Hero's Turn: Fixed Action Overlay positioned around and above Hero's Cards (Exact layout from Image 2) -->
      <div
        v-if="isHeroTurn"
        key="mobile-hero-actions"
        class="fixed inset-0 pointer-events-none z-30 select-none animate-fade-in"
      >
        <!-- Arc of 5 Quick Pot Buttons (hidden when custom raise panel is open) -->
        <div v-if="canRaise && !showCustomSlider" class="pot-arc-layer pointer-events-none">
          <!-- 1. 底池 1/3 (Far Left) -->
          <button
            @click="quickRaise(potAmounts.p1_3)"
            class="absolute pointer-events-auto flex flex-col items-center justify-center w-10 h-10 rounded-full border border-sky-400/60 bg-[#1964a7]/90 text-sky-100 shadow-[0_3px_10px_rgba(0,0,0,0.5)] active:scale-90 transition cursor-pointer"
            style="bottom: 168px; left: calc(50% - 116px); transform: translateX(-50%);"
          >
            <span class="text-[8px] opacity-85 leading-none font-medium">底池</span>
            <span class="text-[10px] font-black leading-tight">1/3</span>
            <span class="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-slate-200 drop-shadow-md whitespace-nowrap">{{ potAmounts.p1_3 }}</span>
          </button>

          <!-- 2. 底池 1/2 (Mid Left) -->
          <button
            @click="quickRaise(potAmounts.p1_2)"
            class="absolute pointer-events-auto flex flex-col items-center justify-center w-10 h-10 rounded-full border border-sky-400/70 bg-[#1d70bb]/90 text-white shadow-[0_3px_10px_rgba(0,0,0,0.5)] active:scale-90 transition cursor-pointer"
            style="bottom: 198px; left: calc(50% - 60px); transform: translateX(-50%);"
          >
            <span class="text-[8px] opacity-85 leading-none font-medium">底池</span>
            <span class="text-[10px] font-black leading-tight">1/2</span>
            <span class="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-slate-200 drop-shadow-md whitespace-nowrap">{{ potAmounts.p1_2 }}</span>
          </button>

          <!-- 3. 底池 2/3 (Center Apex, slightly larger) -->
          <button
            @click="quickRaise(potAmounts.p2_3)"
            class="absolute pointer-events-auto flex flex-col items-center justify-center w-11 h-11 rounded-full border-2 border-sky-300 bg-[#1f7bce] text-white shadow-[0_4px_14px_rgba(31,123,206,0.6)] active:scale-90 transition cursor-pointer"
            style="bottom: 218px; left: 50%; transform: translateX(-50%);"
          >
            <span class="text-[8px] opacity-90 leading-none font-medium">底池</span>
            <span class="text-[11px] font-black leading-tight">2/3</span>
            <span class="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-amber-300 drop-shadow-md whitespace-nowrap">{{ potAmounts.p2_3 }}</span>
          </button>

          <!-- 4. 底池 1 (Mid Right) -->
          <button
            @click="quickRaise(potAmounts.p1_0)"
            class="absolute pointer-events-auto flex flex-col items-center justify-center w-10 h-10 rounded-full border border-amber-600/60 bg-[#524a42]/90 text-amber-200 shadow-[0_3px_10px_rgba(0,0,0,0.5)] active:scale-90 transition cursor-pointer"
            style="bottom: 198px; left: calc(50% + 60px); transform: translateX(-50%);"
          >
            <span class="text-[8px] opacity-85 leading-none font-medium">底池</span>
            <span class="text-[10px] font-black leading-tight">1</span>
            <span class="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-slate-200 drop-shadow-md whitespace-nowrap">{{ potAmounts.p1_0 }}</span>
          </button>

          <!-- 5. 底池 1.2 (Far Right) -->
          <button
            @click="quickRaise(potAmounts.p1_2x)"
            class="absolute pointer-events-auto flex flex-col items-center justify-center w-10 h-10 rounded-full border border-amber-600/50 bg-[#48413a]/90 text-amber-300 shadow-[0_3px_10px_rgba(0,0,0,0.5)] active:scale-90 transition cursor-pointer"
            style="bottom: 168px; left: calc(50% + 116px); transform: translateX(-50%);"
          >
            <span class="text-[8px] opacity-85 leading-none font-medium">底池</span>
            <span class="text-[10px] font-black leading-tight">1.2</span>
            <span class="absolute -bottom-4.5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black text-slate-200 drop-shadow-md whitespace-nowrap">{{ potAmounts.p1_2x }}</span>
          </button>
        </div>

        <!-- Center: 自由加注 (Above Hero's Cards, hidden when panel is open) -->
        <button
          v-if="canRaise && !showCustomSlider"
          @click="handleMobileRaise"
          class="absolute pointer-events-auto w-13 h-13 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white font-black text-xs shadow-[0_4px_16px_rgba(2,132,199,0.7)] border-2 border-white/80 active:scale-90 transition flex flex-col items-center justify-center cursor-pointer"
          style="bottom: 140px; left: 50%; transform: translateX(-50%);"
        >
          <span class="leading-none text-[11px]">自由加注</span>
        </button>

        <!-- Left: 弃牌 (Red Circle to the left of Hero's Cards) -->
        <button
          @click="$emit('act', 'fold', 0)"
          class="absolute pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-rose-500 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-[0_4px_16px_rgba(225,29,72,0.65)] border-2 border-white/70 active:scale-90 transition cursor-pointer"
          style="bottom: 50px; left: calc(50% - 116px); transform: translateX(-50%);"
        >
          弃牌
        </button>

        <!-- Right: 跟注 / 过牌 / All In (Blue/Green Circle to the right of Hero's Cards) -->
        <button
          v-if="callAmount === 0"
          @click="$emit('act', 'check', 0)"
          class="absolute pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-[0_4px_16px_rgba(16,185,129,0.65)] border-2 border-white/70 active:scale-90 transition cursor-pointer"
          style="bottom: 50px; left: calc(50% + 116px); transform: translateX(-50%);"
        >
          过牌
        </button>
        <button
          v-else
          @click="$emit('act', 'call', callAmount)"
          class="absolute pointer-events-auto w-14 h-14 rounded-full bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white font-black text-xs flex flex-col items-center justify-center shadow-[0_4px_16px_rgba(37,99,235,0.65)] border-2 border-white/70 active:scale-90 transition cursor-pointer"
          style="bottom: 50px; left: calc(50% + 116px); transform: translateX(-50%);"
        >
          <span class="font-mono text-xs font-bold leading-tight">{{ Math.min(heroChips, callAmount) }}</span>
          <span class="text-[11px] leading-tight">跟注</span>
        </button>

        <!-- Vertical Slider Panel (牌正上方弹出，快捷下注按钮自动隐藏，下方为 确认加注) -->
        <div
          v-if="showCustomSlider && canRaise"
          class="vertical-slider-panel absolute pointer-events-auto z-40 bg-slate-950/95 border-2 border-amber-500/70 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.9)] backdrop-blur-md p-3 flex flex-col items-center gap-1.5"
          style="bottom: 125px; left: 50%; transform: translateX(-50%); width: 220px;"
        >
          <!-- Top Bar: All In shortcut (100% width) + Close button -->
          <div class="w-full flex items-center gap-2 pb-1.5 border-b border-slate-800">
            <button
              @click="setRaiseAmount(heroChips)"
              class="w-full flex-1 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-black text-xs active:scale-95 transition cursor-pointer flex items-center justify-center tracking-wider shadow-sm"
            >
              All In
            </button>
            <button
              @click="showCustomSlider = false"
              class="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs shrink-0 cursor-pointer active:scale-90 transition"
              title="取消加注"
            >
              ✕
            </button>
          </div>

          <!-- Current Amount Display -->
          <div class="flex items-center gap-1.5 py-0.5">
            <span class="text-xs text-slate-400">加注到:</span>
            <span class="text-base font-black font-mono text-amber-400 drop-shadow-sm">
              {{ currentRaiseValue >= heroChips ? 'All In' : currentRaiseValue }}
            </span>
            <span v-if="currentRaiseValue < heroChips" class="text-[10px] font-mono text-slate-400">
              ({{ Math.round(currentRaiseValue / bigBlind) }}BB)
            </span>
          </div>

          <!-- Steppers & Vertical Slider Track -->
          <div class="flex items-center justify-center gap-3.5 py-0.5">
            <!-- Stepper - Button -->
            <button
              @click="stepDown"
              class="w-7 h-7 rounded-full bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 text-rose-200 font-black text-sm flex items-center justify-center active:scale-90 transition cursor-pointer"
              title="减少 1 大盲"
            >
              -
            </button>

            <!-- Vertical Slider Track (Pointer Events for Touch & Drag) -->
            <div
              ref="verticalTrackRef"
              @pointerdown="onTrackPointerDown"
              @pointermove="onTrackPointerMove"
              class="relative w-3.5 h-28 bg-slate-900 border-2 border-slate-700/80 rounded-full cursor-pointer touch-none flex items-end justify-center select-none shadow-inner"
            >
              <!-- Vertical Fill (Grows upward) -->
              <div
                class="w-full bg-gradient-to-t from-sky-600 via-sky-400 to-amber-400 rounded-full pointer-events-none transition-all duration-75"
                :style="{ height: `${sliderPercentage}%` }"
              ></div>

              <!-- Draggable Circular Thumb -->
              <div
                class="absolute left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-white border-2 border-amber-400 shadow-[0_2px_8px_rgba(0,0,0,0.8)] flex items-center justify-center pointer-events-none transition-all duration-75"
                :style="{ bottom: `calc(${sliderPercentage}% - 11px)` }"
              >
                <div class="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
            </div>

            <!-- Stepper + Button -->
            <button
              @click="stepUp"
              class="w-7 h-7 rounded-full bg-sky-950/80 hover:bg-sky-900 border border-sky-400/60 text-sky-200 font-black text-sm flex items-center justify-center active:scale-90 transition cursor-pointer"
              title="增加 1 大盲"
            >
              +
            </button>
          </div>

          <!-- Bottom: 确认加注 Button -->
          <button
            @click="submitRaise"
            class="w-full mt-0.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-[0_4px_16px_rgba(245,158,11,0.6)] active:scale-95 transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>确认加注</span>
            <span class="font-mono font-black text-xs">({{ currentRaiseValue >= heroChips ? 'All In' : currentRaiseValue }})</span>
          </button>
        </div>
      </div>
    </template>

    <!-- ==================== 2. PC DESKTOP INTERFACE (matching Image 1) ==================== -->
    <template v-else>
      <div class="pc-action-dock relative flex flex-col items-center justify-center h-[76px] min-h-[76px] max-h-[76px] max-w-[560px] w-full">
        <!-- Pre-action Checkboxes or Hand-ended State when not Hero's Turn -->
        <div
          v-if="!isHeroTurn"
          key="pc-pre-actions"
          class="pre-action-overlay absolute inset-0 z-20 flex items-center justify-center pointer-events-auto"
        >
          <!-- Active Hand Opponent Turn: Beautiful Casino Pre-action Pills -->
          <div
            v-if="isHandActive && !isHeroFolded"
            class="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-slate-950/85 border border-slate-800/90 shadow-2xl backdrop-blur-md"
          >
            <!-- 1. 让或弃 -->
            <button
              type="button"
              @click="togglePreAction('checkOrFold')"
              class="pre-action-pill flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs transition-all duration-200 active:scale-95 cursor-pointer select-none"
              :class="
                autoCheckOrFold
                  ? 'bg-gradient-to-r from-rose-950/80 to-rose-900/50 border-rose-500 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.35)]'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800/90 hover:text-white'
              "
            >
              <span
                class="w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-black transition-all"
                :class="
                  autoCheckOrFold
                    ? 'bg-rose-500 border-rose-400 text-white shadow-sm'
                    : 'bg-slate-950/80 border-slate-600 text-transparent'
                "
              >
                ✓
              </span>
              <span class="font-bold tracking-wide">让或弃</span>
            </button>

            <!-- 2. 自动让牌 -->
            <button
              type="button"
              @click="togglePreAction('check')"
              class="pre-action-pill flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs transition-all duration-200 active:scale-95 cursor-pointer select-none"
              :class="
                autoCheck
                  ? 'bg-gradient-to-r from-emerald-950/80 to-emerald-900/50 border-emerald-500 text-emerald-100 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800/90 hover:text-white'
              "
            >
              <span
                class="w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-black transition-all"
                :class="
                  autoCheck
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                    : 'bg-slate-950/80 border-slate-600 text-transparent'
                "
              >
                ✓
              </span>
              <span class="font-bold tracking-wide">自动让牌</span>
            </button>

            <!-- 3. 跟任何注 -->
            <button
              type="button"
              @click="togglePreAction('callAny')"
              class="pre-action-pill flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs transition-all duration-200 active:scale-95 cursor-pointer select-none"
              :class="
                autoCallAny
                  ? 'bg-gradient-to-r from-sky-950/80 to-sky-900/50 border-sky-500 text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.35)]'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:border-slate-500 hover:bg-slate-800/90 hover:text-white'
              "
            >
              <span
                class="w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-black transition-all"
                :class="
                  autoCallAny
                    ? 'bg-sky-500 border-sky-400 text-white shadow-sm'
                    : 'bg-slate-950/80 border-slate-600 text-transparent'
                "
              >
                ✓
              </span>
              <span class="font-bold tracking-wide">跟任何注</span>
            </button>
          </div>

          <!-- Folded Waiting State -->
          <div
            v-else-if="isHeroFolded"
            class="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 shadow-md backdrop-blur-md"
          >
            <span>🚫</span>
            <span>已弃牌，观战中...</span>
          </div>

          <!-- Hand Ended / Waiting State -->
          <div
            v-else
            class="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 shadow-md backdrop-blur-md"
          >
            <span>⏳</span>
            <span>牌局等待中...</span>
          </div>
        </div>

        <!-- PC Hero Action Console (Always occupies compact footprint so table NEVER jumps) -->
        <div
          class="pc-controls-card bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-xl backdrop-blur-md flex flex-col gap-1.5 w-full transition-all duration-200"
          :class="isHeroTurn ? 'opacity-100 pointer-events-auto visible' : 'opacity-0 pointer-events-none select-none invisible'"
        >
          <!-- Row 1: 5 Compact Pot Pills (Left) + Stepper & Amount Tag (Right) -->
          <div class="flex items-center justify-between gap-2" :class="canRaise ? '' : 'invisible pointer-events-none'">
            <!-- Quick Pot Presets -->
            <div class="flex items-center gap-1">
              <button
                @click="setRaiseAmount(potAmounts.p1_3)"
                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border"
                :class="currentRaiseValue === potAmounts.p1_3 ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'"
              >
                1/3({{ potAmounts.p1_3 }})
              </button>
              <button
                @click="setRaiseAmount(potAmounts.p1_2)"
                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border"
                :class="currentRaiseValue === potAmounts.p1_2 ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'"
              >
                1/2({{ potAmounts.p1_2 }})
              </button>
              <button
                @click="setRaiseAmount(potAmounts.p2_3)"
                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border"
                :class="currentRaiseValue === potAmounts.p2_3 ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'"
              >
                2/3({{ potAmounts.p2_3 }})
              </button>
              <button
                @click="setRaiseAmount(potAmounts.p1_0)"
                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border"
                :class="currentRaiseValue === potAmounts.p1_0 ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'"
              >
                全池({{ potAmounts.p1_0 }})
              </button>
              <button
                @click="setRaiseAmount(heroChips)"
                class="px-2 py-0.5 rounded text-[10px] font-bold font-mono transition border bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
              >
                All In
              </button>
            </div>

            <!-- Stepper Controls & Current Amount -->
            <div class="flex items-center gap-1">
              <button
                @click="stepDown"
                class="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center hover:bg-rose-500/30 active:scale-90 transition"
              >
                -
              </button>
              <div class="amount-box px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono font-black text-xs min-w-[55px] text-center shadow-inner">
                {{ currentRaiseValue }}
              </div>
              <button
                @click="stepUp"
                class="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center hover:bg-sky-500/30 active:scale-90 transition"
              >
                +
              </button>
            </div>
          </div>

          <!-- Row 2: Slider (Left) + 3 Action Buttons (Right) -->
          <div class="flex items-center gap-2">
            <!-- Arco Slider Bar (when raise is possible) -->
            <div class="flex-1 px-1" :class="canRaise ? '' : 'invisible pointer-events-none'">
              <a-slider
                v-if="canRaise"
                v-model="currentRaiseValue"
                :min="Math.min(minRaiseAmount, heroChips)"
                :max="Math.max(minRaiseAmount, heroChips)"
                :step="bigBlind"
              />
            </div>

            <!-- 3 Main Action Buttons -->
            <div class="flex items-center gap-1.5">
              <!-- Fold Button -->
              <button
                @click="$emit('act', 'fold', 0)"
                class="px-3.5 py-1.5 rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 border border-rose-400/80 text-white font-black text-xs shadow-md active:scale-95 transition flex items-center justify-center whitespace-nowrap cursor-pointer"
              >
                弃牌
              </button>

              <!-- Check or Call Button -->
              <button
                v-if="callAmount === 0"
                @click="$emit('act', 'check', 0)"
                class="px-4 py-1.5 rounded-lg bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 border border-emerald-400/80 text-white font-black text-xs shadow-md active:scale-95 transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>过牌</span>
                <span class="text-[10px] opacity-70">Check</span>
              </button>
              <button
                v-else
                @click="$emit('act', 'call', callAmount)"
                class="px-4 py-1.5 rounded-lg bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 border border-blue-400/80 text-white font-black text-xs shadow-md active:scale-95 transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>跟注</span>
                <span class="font-mono font-bold">{{ Math.min(heroChips, callAmount) }}</span>
              </button>

              <!-- Raise or All In Button -->
              <button
                v-if="canRaise"
                @click="submitRaise"
                class="px-4 py-1.5 rounded-lg bg-gradient-to-b from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 border border-amber-300 text-slate-950 font-black text-xs shadow-md active:scale-95 transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>{{ currentRaiseValue >= heroChips ? 'All In' : '加注' }}</span>
                <span class="font-mono">{{ currentRaiseValue }}</span>
              </button>

              <button
                v-else-if="heroChips > 0 && heroChips > callAmount"
                @click="$emit('act', 'allin', heroChips)"
                class="px-4 py-1.5 rounded-lg bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 border border-rose-400 text-white font-black text-xs shadow-md active:scale-95 transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
              >
                <span>All In</span>
                <span class="font-mono">{{ heroChips }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type { PlayerAction } from '../types/poker';

const props = withDefaults(
  defineProps<{
    isHeroTurn: boolean;
    isHandActive: boolean;
    isHeroFolded?: boolean;
    callAmount: number;
    currentHighestBet: number;
    minRaiseAmount: number;
    heroChips: number;
    totalPot: number;
    bigBlind: number;
    turnTimeRemaining: number;
    turnTotalTime: number;
    extensionsUsed: number;
    autoCheckOrFold: boolean;
    autoCheck: boolean;
    autoCallAny: boolean;
  }>(),
  {
    isHeroTurn: false,
    isHandActive: false,
    isHeroFolded: false,
    callAmount: 0,
    currentHighestBet: 0,
    minRaiseAmount: 40,
    heroChips: 1200,
    totalPot: 0,
    bigBlind: 40,
    turnTimeRemaining: 20,
    turnTotalTime: 20,
    extensionsUsed: 0,
    autoCheckOrFold: false,
    autoCheck: false,
    autoCallAny: false,
  }
);

const emit = defineEmits<{
  (e: 'act', action: PlayerAction, amount: number): void;
  (e: 'extend-time'): void;
  (e: 'update:autoCheckOrFold', val: boolean): void;
  (e: 'update:autoCheck', val: boolean): void;
  (e: 'update:autoCallAny', val: boolean): void;
}>();

const windowWidth = ref<number>(typeof window !== 'undefined' ? window.innerWidth : 1024);
const windowHeight = ref<number>(typeof window !== 'undefined' ? window.innerHeight : 768);

function onResize() {
  windowWidth.value = window.innerWidth;
  windowHeight.value = window.innerHeight;
}

onMounted(() => {
  window.addEventListener('resize', onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', onResize);
});

const isMobile = computed(() => windowWidth.value < 768 || windowHeight.value > windowWidth.value);

const currentRaiseValue = ref<number>(props.minRaiseAmount);
const showCustomSlider = ref<boolean>(false);

watch(
  () => props.isHeroTurn,
  (turn) => {
    if (turn) {
      showCustomSlider.value = false;
      currentRaiseValue.value = Math.min(
        props.heroChips,
        Math.max(props.minRaiseAmount, props.bigBlind * 2)
      );
    }
  }
);

watch(
  () => props.minRaiseAmount,
  (val) => {
    if (currentRaiseValue.value < val) {
      currentRaiseValue.value = Math.min(props.heroChips, val);
    }
  }
);

watch(
  () => props.isHeroFolded,
  (folded) => {
    if (folded) {
      if (props.autoCheckOrFold) emit('update:autoCheckOrFold', false);
      if (props.autoCheck) emit('update:autoCheck', false);
      if (props.autoCallAny) emit('update:autoCallAny', false);
    }
  }
);

const canRaise = computed(() => {
  return props.heroChips > props.callAmount && props.heroChips >= props.minRaiseAmount;
});

// Pot-sized bets calculations matching real poker / Image 1 & 2
const potAmounts = computed(() => {
  const pot = props.totalPot;
  const call = props.callAmount;
  const base = pot + call;

  const clamp = (val: number) => {
    return Math.min(props.heroChips, Math.max(props.minRaiseAmount, Math.round(val)));
  };

  return {
    p1_3: clamp(call + base * (1 / 3)),
    p1_2: clamp(call + base * (1 / 2)),
    p2_3: clamp(call + base * (2 / 3)),
    p1_0: clamp(call + base * 1.0),
    p1_2x: clamp(call + base * 1.2),
  };
});

function setRaiseAmount(amt: number) {
  currentRaiseValue.value = Math.max(props.minRaiseAmount, Math.min(props.heroChips, amt));
}

function stepUp() {
  const next = currentRaiseValue.value + props.bigBlind;
  currentRaiseValue.value = Math.min(props.heroChips, next);
}

function stepDown() {
  const prev = currentRaiseValue.value - props.bigBlind;
  currentRaiseValue.value = Math.max(props.minRaiseAmount, prev);
}

// Vertical Slider Pointer Tracking (Touch & Mouse Drag)
const verticalTrackRef = ref<HTMLElement | null>(null);

const sliderPercentage = computed(() => {
  const min = props.minRaiseAmount;
  const max = props.heroChips;
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((currentRaiseValue.value - min) / (max - min)) * 100));
});

function updateValueFromPointerY(clientY: number) {
  if (!verticalTrackRef.value) return;
  const rect = verticalTrackRef.value.getBoundingClientRect();
  // In vertical slider, bottom is 0% (min), top is 100% (max)
  const ratio = Math.max(0, Math.min(1, (rect.bottom - clientY) / rect.height));
  const min = props.minRaiseAmount;
  const max = props.heroChips;
  const step = props.bigBlind;
  const raw = min + ratio * (max - min);
  const stepped = Math.round((raw - min) / step) * step + min;
  currentRaiseValue.value = Math.min(max, Math.max(min, stepped));
}

function onTrackPointerDown(e: PointerEvent) {
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  updateValueFromPointerY(e.clientY);
}

function onTrackPointerMove(e: PointerEvent) {
  if (e.buttons === 1) {
    updateValueFromPointerY(e.clientY);
  }
}

function submitRaise() {
  if (currentRaiseValue.value >= props.heroChips) {
    emit('act', 'allin', props.heroChips);
  } else {
    emit('act', 'raise', currentRaiseValue.value);
  }
}

function quickRaise(amt: number) {
  setRaiseAmount(amt);
  submitRaise();
}

function handleMobileRaise() {
  if (!showCustomSlider.value) {
    showCustomSlider.value = true;
  } else {
    submitRaise();
  }
}

function togglePreAction(type: 'checkOrFold' | 'check' | 'callAny') {
  if (type === 'checkOrFold') {
    const nextVal = !props.autoCheckOrFold;
    emit('update:autoCheckOrFold', nextVal);
    if (nextVal) {
      emit('update:autoCheck', false);
      emit('update:autoCallAny', false);
    }
  } else if (type === 'check') {
    const nextVal = !props.autoCheck;
    emit('update:autoCheck', nextVal);
    if (nextVal) {
      emit('update:autoCheckOrFold', false);
      emit('update:autoCallAny', false);
    }
  } else if (type === 'callAny') {
    const nextVal = !props.autoCallAny;
    emit('update:autoCallAny', nextVal);
    if (nextVal) {
      emit('update:autoCheckOrFold', false);
      emit('update:autoCheck', false);
    }
  }
}
</script>

<style scoped>
.pot-circle-btn {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.vertical-slider-panel {
  transform: translateX(-50%);
  animation: popPanelIn 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes popPanelIn {
  from {
    opacity: 0;
    transform: translateX(-50%) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}
</style>
