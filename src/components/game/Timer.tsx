"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/i18n/useT";

type TimerProps = {
  seconds: number;
  maxSeconds: number;
};

export const Timer = ({ seconds, maxSeconds }: TimerProps) => {
  const t = useT();
  const percentage = (seconds / maxSeconds) * 100;
  const isUrgent = seconds <= 3;
  const isCritical = seconds <= 1;

  const barColor = isCritical
    ? "bg-red-600"
    : isUrgent
      ? "bg-orange-500"
      : "bg-green-500";

  const textColor = isCritical
    ? "text-red-500"
    : isUrgent
      ? "text-orange-400"
      : "text-white";

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] text-gray-400 font-medium">{t("game.timer.label")}</span>
        <motion.span
          key={seconds}
          initial={isUrgent ? { scale: 1.3 } : { scale: 1 }}
          animate={{ scale: 1 }}
          className={`text-sm font-bold tabular-nums ${textColor}`}
        >
          {t("game.timer.seconds", { n: seconds })}
        </motion.span>
      </div>
      <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: "100%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
