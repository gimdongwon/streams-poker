// 퀵챗 이모트 정의 — 서버(server/types.ts EMOTE_IDS)와 id가 반드시 일치해야 한다.
// 문구는 i18n 키 `emote.<id>` 로 관리 (ko/en).
export const EMOTES = [
  { id: "hello", emoji: "👋" },
  { id: "nice", emoji: "👏" },
  { id: "wow", emoji: "😲" },
  { id: "cheer", emoji: "💪" },
  { id: "close", emoji: "😅" },
  { id: "hurry", emoji: "⏰" },
  { id: "gg", emoji: "🤝" },
  { id: "fire", emoji: "🔥" },
] as const;

export type EmoteId = (typeof EMOTES)[number]["id"];

export const emoteEmoji = (id: string): string =>
  EMOTES.find((e) => e.id === id)?.emoji ?? "💬";
