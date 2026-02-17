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
  one_pair: "text-gray-400",
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
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gray-800 border border-gray-600 hover:bg-gray-700 hover:border-gray-500 flex items-center justify-center transition-all shadow-lg shadow-black/30 hover:scale-110 active:scale-95"
        aria-label="족보 보기"
        title="족보 보기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 text-yellow-400"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
        className="relative z-10 w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-yellow-400">♠</span>
            포커 족보
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* 족보 리스트 */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
          {COMBINATION_TABLE.map((combo) => (
            <div
              key={combo.type}
              className="flex items-center justify-between bg-gray-700/40 rounded-lg p-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-gray-500 text-xs font-mono w-5 text-right">
                  {combo.rank}
                </span>
                <div>
                  <div
                    className={`font-semibold text-sm ${COMBO_COLORS[combo.type] || "text-white"}`}
                  >
                    {combo.name}
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    {COMBO_DESCRIPTIONS[combo.type]}
                  </div>
                </div>
              </div>
              <span className="text-yellow-400 font-bold text-base">
                {combo.score}점
              </span>
            </div>
          ))}
        </div>

        {/* 규칙 안내 */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <h3 className="text-gray-400 text-xs font-bold mb-2">규칙</h3>
          <ul className="text-gray-500 text-[11px] space-y-1">
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
