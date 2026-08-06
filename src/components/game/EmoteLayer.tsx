"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomStore } from "@/stores/roomStore";
import { EMOTES, emoteEmoji } from "@/lib/emotes";
import { useT } from "@/lib/i18n/useT";

// 퀵챗 레이어: 좌하단 이모트 버튼 + 피커, 상단 중앙 말풍선 스택.
// 대기방과 멀티 게임 화면에서 사용한다. (자유 입력 없음 — 사전 정의 문구만)
export const EmoteLayer = () => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const sendEmote = useRoomStore((s) => s.sendEmote);
  const activeEmotes = useRoomStore((s) => s.activeEmotes);

  const handlePick = (id: string) => {
    sendEmote(id);
    setOpen(false);
  };

  return (
    <>
      {/* 수신 말풍선 — 상단 중앙, 최신이 아래로 쌓임 */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1.5 pointer-events-none safe-pad-x">
        <AnimatePresence>
          {activeEmotes.map((e) => (
            <motion.div
              key={e.key}
              initial={{ opacity: 0, y: -8, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              className="bg-panel/95 border border-neon-cyan/40 rounded-full px-3.5 py-1.5 shadow-lg shadow-black/40 flex items-center gap-1.5 max-w-[80vw]"
            >
              <span className="text-haze text-[10px] font-bold truncate max-w-[7rem]">
                {e.nickname}
              </span>
              <span className="text-sm leading-none">{emoteEmoji(e.emoteId)}</span>
              <span className="text-snow text-xs font-medium whitespace-nowrap">
                {t(`emote.${e.emoteId}`)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 이모트 버튼 + 피커 — 우하단 */}
      <div className="fixed bottom-3 right-3 z-40 safe-pad">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute bottom-12 right-0 bg-panel border border-edge rounded-2xl p-2 shadow-xl shadow-black/50 grid grid-cols-2 gap-1 w-56"
            >
              {EMOTES.map((e) => (
                <button
                  key={e.id}
                  onClick={() => handlePick(e.id)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-edge active:scale-95 transition text-left"
                  aria-label={t(`emote.${e.id}`)}
                >
                  <span className="text-base leading-none shrink-0">{e.emoji}</span>
                  <span className="text-snow text-[11px] font-medium truncate">
                    {t(`emote.${e.id}`)}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={t("emote.open")}
          aria-expanded={open}
          className={`w-10 h-10 rounded-full border shadow-lg shadow-black/40 flex items-center justify-center text-lg transition active:scale-95 ${
            open
              ? "bg-neon-cyan/20 border-neon-cyan/60"
              : "bg-panel/90 border-edge hover:bg-edge"
          }`}
        >
          💬
        </button>
      </div>
    </>
  );
};
