"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Card } from "@/types/card";
import { isJoker } from "@/types/card";
import { GameCard } from "./Card";

type CurrentCardProps = {
  card: Card | null;
};

export const CurrentCard = ({ card }: CurrentCardProps) => {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-gray-400 text-[10px] font-medium">현재 카드</span>
      <div className="relative w-20 h-28 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {card ? (
            <motion.div
              key={card.id}
              initial={{ rotateY: 180, scale: 0.5 }}
              animate={{ rotateY: 0, scale: 1 }}
              exit={{ y: -30, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute"
            >
              <GameCard card={card} size="md" />
              {isJoker(card) && <JokerEffect />}
            </motion.div>
          ) : (
            <div className="w-20 h-28 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center">
              <span className="text-gray-600 text-[10px]">대기중</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const JokerEffect = () => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 1 }}
      animate={{ scale: 3, opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
    >
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-yellow-400 via-red-500 to-purple-600" />
    </motion.div>
  );
};
