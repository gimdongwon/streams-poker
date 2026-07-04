"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { playSound } from "@/lib/sound";
import { useT } from "@/lib/i18n/useT";

export const MuteButton = () => {
  const t = useT();
  const muted = useSettingsStore((s) => s.muted);
  const toggleMuted = useSettingsStore((s) => s.toggleMuted);

  const handleToggle = () => {
    const wasMuted = muted;
    toggleMuted();
    // Play feedback only when turning sound ON (was muted, now unmuted).
    if (wasMuted) playSound("click");
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      tabIndex={0}
      aria-label={muted ? t("misc.mute.on") : t("misc.mute.off")}
      aria-pressed={muted}
      className="text-haze hover:text-snow p-1.5 rounded-lg hover:bg-edge transition-colors leading-none"
    >
      <span className="text-base">{muted ? "🔇" : "🔊"}</span>
    </button>
  );
};
