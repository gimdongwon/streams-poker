import { supabase } from "./supabase";
import type { LeaderboardEntry, LeaderboardInsert } from "@/types/leaderboard";

export const fetchLeaderboard = async (
  limit = 20
): Promise<LeaderboardEntry[]> => {
  const { data, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("score", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
};

export const submitScore = async (
  entry: LeaderboardInsert
): Promise<LeaderboardEntry> => {
  const { data, error } = await supabase
    .from("leaderboard")
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const fetchPlayerRank = async (score: number): Promise<number> => {
  const { count, error } = await supabase
    .from("leaderboard")
    .select("*", { count: "exact", head: true })
    .gt("score", score);

  if (error) throw error;
  return (count ?? 0) + 1;
};
