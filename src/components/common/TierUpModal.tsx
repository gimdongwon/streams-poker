"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Tier } from "@/lib/tier";
import { TierBadge } from "@/components/common/TierBadge";
import { useT } from "@/lib/i18n/useT";

// 티어 승급 축하 레이어. 로비에서 누적 점수 갱신 시 승급이 감지되면 표시된다.
export const TierUpModal = ({
  tier,
  onClose,
}: {
  tier: Tier | null;
  onClose: () => void;
}) => {
  const t = useT();

  return (
    <AnimatePresence>
      {tier && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-8 py-6 bg-void/80"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t("tierup.title")}
        >
          <motion.div
            className="w-full max-w-xs bg-panel border rounded-2xl p-7 shadow-2xl text-center"
            style={{
              borderColor: tier.color,
              boxShadow: `0 0 60px ${tier.color}44`,
            }}
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 배지 (펄스 글로우) */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1.6, rotate: 0 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
              className="inline-block mb-4"
            >
              <TierBadge totalScore={tier.min} size="md" showLabel={false} />
            </motion.div>

            <p className="text-haze text-[11px] tracking-[3px] uppercase font-bold">
              {t("tierup.title")}
            </p>
            <h2
              className="text-3xl font-black mt-1.5"
              style={{ color: tier.color, textShadow: `0 0 24px ${tier.color}88` }}
            >
              {tier.label}
            </h2>
            <p className="text-haze text-xs leading-relaxed mt-3 mb-5">
              {t("tierup.desc", { tier: tier.label })}
            </p>

            <button
              onClick={onClose}
              style={{ background: "linear-gradient(135deg, #2de2e6, #ff2e97)" }}
              className="w-full py-3 rounded-xl text-void text-sm font-extrabold transition-all active:scale-95 hover:scale-[1.01]"
            >
              {t("tierup.cta")}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
