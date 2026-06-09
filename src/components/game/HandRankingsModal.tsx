"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { COMBINATION_TABLE } from "@/types/game";

const COMBO_COLORS: Record<string, string> = {
  royal_straight_flush: "text-yellow-400",
  back_straight_flush: "text-purple-400",
  straight_flush: "text-purple-400",
  four_of_a_kind: "text-red-400",
  mountain: "text-emerald-400",
  full_house: "text-orange-400",
  back_straight: "text-emerald-400",
  flush: "text-blue-400",
  straight: "text-emerald-400",
  triple: "text-amber-400",
  two_pair: "text-cyan-400",
  one_pair: "text-haze",
};

const COMBO_DESCRIPTIONS: Record<string, string> = {
  royal_straight_flush: "10-J-Q-K-A + 같은 문양",
  back_straight_flush: "A-2-3-4-5 + 같은 문양",
  straight_flush: "연속 5장 + 같은 문양",
  four_of_a_kind: "동일 숫자 4장",
  mountain: "10-J-Q-K-A (문양 무관)",
  full_house: "같은 숫자 3장 + 2장",
  back_straight: "A-2-3-4-5 (문양 무관)",
  flush: "같은 문양 5장 (위치 무관)",
  straight: "연속 슬롯 5장 연속 숫자",
  triple: "같은 숫자 3장",
  two_pair: "페어 2개",
  one_pair: "같은 숫자 2장",
};

export const HandRankingsButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 group">
        <button
          onClick={() => setIsOpen(true)}
          className="w-11 h-11 rounded-full bg-panel border border-edge hover:bg-edge hover:border-neon-cyan/50 flex items-center justify-center transition-all shadow-lg shadow-black/30 hover:scale-110 active:scale-95"
          aria-label="족보 보기"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6"
          >
            {/* 뒤쪽 카드 */}
            <rect x="2" y="3" width="13" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-haze" />
            {/* 앞쪽 카드 */}
            <rect x="9" y="3" width="13" height="18" rx="2" fill="#131826" stroke="currentColor" strokeWidth="1.5" className="text-neon-cyan" />
            {/* 스페이드 ♠ */}
            <path
              d="M15.5 8.5c0 1.8-2.5 3.5-2.5 3.5s-2.5-1.7-2.5-3.5c0-1.4 1.1-2.5 2.5-2.5s2.5 1.1 2.5 2.5z"
              fill="currentColor"
              className="text-neon-cyan"
            />
            <line x1="13" y1="12" x2="13" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-neon-cyan" />
          </svg>
        </button>
        {/* 툴팁 */}
        <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1 bg-edge text-snow text-[10px] font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg border border-edge">
          족보 보기
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#232b3d]" />
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <HandRankingsModal onClose={() => setIsOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

type ModalProps = {
  onClose: () => void;
};

const HandRankingsModal = ({ onClose }: ModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
    >
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="모달 닫기"
      />

      {/* 모달 */}
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-sm bg-panel border border-edge rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-edge">
          <h2 className="text-sm font-bold text-snow flex items-center gap-2">
            <span className="text-neon-cyan">♠</span>
            포커 족보
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-edge hover:bg-edge/70 flex items-center justify-center text-haze hover:text-snow transition-colors text-xs"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="p-3 max-h-[60vh] overflow-y-auto space-y-1.5">
          {COMBINATION_TABLE.map((combo) => (
            <div
              key={combo.type}
              className="flex items-center justify-between bg-edge/40 rounded-lg px-2.5 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-haze text-[10px] font-mono w-4 text-right">
                  {combo.rank}
                </span>
                <div>
                  <div
                    className={`font-semibold text-xs ${COMBO_COLORS[combo.type] || "text-snow"}`}
                  >
                    {combo.name}
                  </div>
                  <div className="text-haze text-[10px]">
                    {COMBO_DESCRIPTIONS[combo.type]}
                  </div>
                </div>
              </div>
              <span className="text-yellow-400 font-bold text-xs shrink-0 ml-2">
                {combo.score}점
              </span>
            </div>
          ))}
        </div>

        <div className="px-3 py-2.5 border-t border-edge bg-void/40">
          <h3 className="text-haze text-[10px] tracking-[2px] uppercase font-bold mb-1.5">규칙</h3>
          <ul className="text-haze text-[10px] space-y-0.5">
            <li>• 한 카드는 하나의 조합에만 사용 가능</li>
            <li>• 스트레이트 계열은 연속 슬롯 기반, 상위 1개만 적용</li>
            <li>• 플러시는 슬롯 위치 무관, 같은 문양 5장</li>
            <li>• 조커는 와일드카드, 최적 조합 자동 배정</li>
          </ul>
        </div>
      </motion.div>
    </motion.div>
  );
};
