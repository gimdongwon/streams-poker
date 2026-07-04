import type { Locale } from "../locales";
import { common, type Dict, type Namespace } from "./common";
import { auth } from "./auth";
import { lobby } from "./lobby";
import { room } from "./room";
import { game } from "./game";
import { result } from "./result";
import { friends } from "./friends";
import { tier } from "./tier";
import { hands } from "./hands";
import { leaderboard } from "./leaderboard";
import { misc } from "./misc";
import { me } from "./me";

const NAMESPACES: Namespace[] = [
  common,
  auth,
  lobby,
  room,
  game,
  result,
  friends,
  tier,
  hands,
  leaderboard,
  misc,
  me,
];

const mergeLocale = (locale: Locale): Dict =>
  Object.assign({}, ...NAMESPACES.map((ns) => ns[locale]));

export const messages: Record<Locale, Dict> = {
  ko: mergeLocale("ko"),
  en: mergeLocale("en"),
};
