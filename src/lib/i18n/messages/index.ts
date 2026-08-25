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
import { coins } from "./coins";
import { emotes } from "./emotes";
import { daily } from "./daily";
import { achievements } from "./achievements";
import { landing } from "./landing";
import { tutorial } from "./tutorial";

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
  coins,
  emotes,
  daily,
  achievements,
  landing,
  tutorial,
];

const mergeLocale = (locale: Locale): Dict =>
  Object.assign({}, ...NAMESPACES.map((ns) => ns[locale]));

export const messages: Record<Locale, Dict> = {
  ko: mergeLocale("ko"),
  en: mergeLocale("en"),
};
