"use client";

import { motion } from "framer-motion";
import { TIERS, getTier, nextTier } from "@/lib/tier";

type TierInfoModalProps = {
  totalScore: number;
  onClose: () => void;
};

export const TierInfoModal = ({ totalScore, onClose }: TierInfoModalProps) => {
  const current = getTier(totalScore);
  const next = nextTier(totalScore);

  // 진행바: 현재 티어 시작점 ~ 다음 티어 시작점 사이에서의 위치
  const progress =
    next && next.next.min > current.min
      ? Math.min(
          100,
          Math.round(
            ((totalScore - current.min) / (next.next.min - current.min)) * 100
          )
        )
      : 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="티어 안내 닫기"
      />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-sm bg-panel border border-edge rounded-2xl p-4"
      >
        <h3 className="text-snow text-sm font-bold mb-1">티어 안내</h3>
        <p className="text-haze text-[11px] mb-3">
          누적 점수로 티어가 결정돼요.{" "}
          {next ? (
            <>
              <span className="font-bold" style={{ color: next.next.color }}>
                {next.next.label}
              </span>
              까지 <span className="text-snow font-bold">{next.remaining}점</span> 남음
            </>
          ) : (
            <span className="text-snow font-bold">최고 티어 달성!</span>
          )}
        </p>

        {/* 다음 티어 진행바 */}
        <div className="h-1.5 w-full rounded-full bg-edge overflow-hidden mb-4">
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${current.color}, ${next ? next.next.color : current.color})`,
            }}
          />
        </div>

        {/* 구간 목록 (높은 → 낮은) */}
        <div className="space-y-1.5">
          {[...TIERS].reverse().map((t) => {
            const isCurrent = t.key === current.key;
            const idx = TIERS.findIndex((x) => x.key === t.key);
            const upper = TIERS[idx + 1];
            const range = upper ? `${t.min} ~ ${upper.min - 1}점` : `${t.min}점 이상`;
            return (
              <div
                key={t.key}
                className={`flex items-center justify-between rounded-lg px-3 py-2 border ${
                  isCurrent ? "bg-edge/60" : "border-transparent"
                }`}
                style={isCurrent ? { borderColor: `${t.color}66` } : undefined}
              >
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-sm font-bold" style={{ color: t.color }}>
                    {t.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[9px] font-extrabold text-void bg-neon-cyan px-1.5 py-0.5 rounded-full">
                      나
                    </span>
                  )}
                </span>
                <span className="text-haze text-[11px]">{range}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-haze hover:text-snow text-xs font-medium rounded-xl transition-colors bg-void border border-edge hover:bg-edge"
          aria-label="닫기"
        >
          닫기
        </button>
      </motion.div>
    </motion.div>
  );
};
