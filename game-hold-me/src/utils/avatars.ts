import type { BotPersonality } from "../types/poker";

export interface BotProfile {
  name: string;
  avatar: string;
  personality: BotPersonality;
}

export const PERSONALITY_INFO: Record<
  BotPersonality,
  { label: string; desc: string; color: string; badgeClass: string }
> = {
  激进哥: {
    label: "激进哥",
    desc: "打法极具侵略性，频繁加注、善于诈唬、敢推All-in",
    color: "#ef4444",
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/40",
  },
  非要看: {
    label: "非要看",
    desc: "必须看翻牌3张牌才考虑弃牌，翻前跟注率极高",
    color: "#eab308",
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  },
  紧紧哥: {
    label: "紧紧哥",
    desc: "只打强牌，翻前弃牌率极高，一旦入局必有大料",
    color: "#3b82f6",
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  },
  大鱼: {
    label: "大鱼",
    desc: "纯新手菜鸟，随缘跟注、偶尔盲目反击、容易送筹码",
    color: "#10b981",
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  },
};

// Generate high-quality SVG avatars (clean icon silhouette for bots, no text inside avatar)
export function getFallbackAvatar(
  name: string,
  index: number,
  isHuman = false,
): string {
  const hues = [210, 340, 45, 160, 280, 20, 190, 310, 130, 260, 15, 230];
  const hue = hues[index % hues.length];

  if (isHuman || name === "You") {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="gh" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%238b5cf6"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23gh)" stroke="rgba(255,255,255,0.6)" stroke-width="4"/><text x="50" y="56" font-size="28" font-weight="bold" font-family="system-ui, -apple-system, sans-serif" fill="%23ffffff" text-anchor="middle" dominant-baseline="middle">Yo</text></svg>`;
  }

  // Pure aesthetic vector player silhouette for bots (ZERO text/nickname inside avatar)
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="gb${index}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="hsl(${hue}, 80%, 48%)"/><stop offset="100%" stop-color="hsl(${hue + 35}, 85%, 26%)"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(%23gb${index})" stroke="rgba(255,255,255,0.4)" stroke-width="4"/><circle cx="50" cy="38" r="17" fill="%23ffffff" opacity="0.92"/><path d="M 23 82 C 23 63, 34 57, 50 57 C 66 57, 77 63, 77 82 Z" fill="%23ffffff" opacity="0.92"/></svg>`;
}

// Default presets with user-specified authentic poker player names and personalities
export const PRESET_BOTS: BotProfile[] = [
  { name: "谭轩", avatar: getFallbackAvatar("谭轩", 0), personality: "激进哥" },
  { name: "JJE", avatar: getFallbackAvatar("JJE", 1), personality: "非要看" },
  { name: "Yara", avatar: getFallbackAvatar("Yara", 2), personality: "紧紧哥" },
  {
    name: "臧书奴",
    avatar: getFallbackAvatar("臧书奴", 3),
    personality: "大鱼",
  },
  {
    name: "ST Wang",
    avatar: getFallbackAvatar("ST Wang", 4),
    personality: "激进哥",
  },
  {
    name: "Elton",
    avatar: getFallbackAvatar("Elton", 5),
    personality: "非要看",
  },
  {
    name: "维克托",
    avatar: getFallbackAvatar("维克托", 6),
    personality: "紧紧哥",
  },
  {
    name: "布兰妮",
    avatar: getFallbackAvatar("布兰妮", 7),
    personality: "大鱼",
  },
  { name: "李四", avatar: getFallbackAvatar("李四", 8), personality: "激进哥" },
  { name: "王五", avatar: getFallbackAvatar("王五", 9), personality: "非要看" },
  {
    name: "赵六",
    avatar: getFallbackAvatar("赵六", 10),
    personality: "紧紧哥",
  },
];
