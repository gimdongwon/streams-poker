import { supabase } from "./supabase";

// username(아이디)로 조회한 유저의 공개 정보 (password_hash 절대 노출 X)
export type FriendUser = {
  id: string;
  username: string;
  nickname: string;
};

// 수락된 친구 1명 (티어 표시용 누적 점수 포함)
export type Friend = {
  friendshipId: string;
  userId: string;
  username: string;
  nickname: string;
  totalScore: number;
};

// 받은 친구 요청 (pending)
export type FriendRequest = {
  friendshipId: string;
  requester: FriendUser;
  createdAt: string;
};

// Postgres unique violation
const UNIQUE_VIOLATION = "23505";

// username 정확 일치로 유저 조회
export const findUserByUsername = async (
  username: string
): Promise<FriendUser | null> => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, nickname")
    .eq("username", username)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
};

// 친구 요청 보내기. 중복(이미 친구/요청)인 경우 unique 인덱스 위반을 친절한 에러로 변환.
export const sendFriendRequest = async (
  requesterId: string,
  addresseeId: string
): Promise<void> => {
  const { error } = await supabase.from("friendships").insert({
    requester_id: requesterId,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      throw new Error("이미 친구이거나 요청이 있습니다");
    }
    throw error;
  }
};

// 수락된 친구 목록. 양방향(requester/addressee) 관계에서 상대편을 추려 정보/티어 점수 스티칭.
export const listFriends = async (userId: string): Promise<Friend[]> => {
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  // 상대편 userId 매핑 (friendshipId 유지)
  const pairs = rows.map((r) => ({
    friendshipId: r.id as string,
    friendId:
      (r.requester_id as string) === userId
        ? (r.addressee_id as string)
        : (r.requester_id as string),
  }));

  const friendIds = pairs.map((p) => p.friendId);

  // 친구들의 username/nickname
  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, username, nickname")
    .in("id", friendIds);

  if (usersErr) throw usersErr;

  const userMap = new Map<string, FriendUser>();
  for (const u of users ?? []) {
    userMap.set(u.id as string, {
      id: u.id as string,
      username: u.username as string,
      nickname: u.nickname as string,
    });
  }

  // 친구들의 누적 점수 (user_rankings 뷰, 없으면 0)
  const { data: rankings, error: rankErr } = await supabase
    .from("user_rankings")
    .select("user_id, total_score")
    .in("user_id", friendIds);

  if (rankErr) throw rankErr;

  const scoreMap = new Map<string, number>();
  for (const r of rankings ?? []) {
    scoreMap.set(r.user_id as string, (r.total_score as number) ?? 0);
  }

  const friends: Friend[] = [];
  for (const p of pairs) {
    const u = userMap.get(p.friendId);
    if (!u) continue; // 유저가 삭제된 경우 스킵
    friends.push({
      friendshipId: p.friendshipId,
      userId: u.id,
      username: u.username,
      nickname: u.nickname,
      totalScore: scoreMap.get(p.friendId) ?? 0,
    });
  }

  return friends;
};

// 받은 친구 요청(pending) 목록 + 요청자 정보.
export const listIncomingRequests = async (
  userId: string
): Promise<FriendRequest[]> => {
  const { data: rows, error } = await supabase
    .from("friendships")
    .select("id, requester_id, created_at")
    .eq("addressee_id", userId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!rows || rows.length === 0) return [];

  const requesterIds = rows.map((r) => r.requester_id as string);

  const { data: users, error: usersErr } = await supabase
    .from("users")
    .select("id, username, nickname")
    .in("id", requesterIds);

  if (usersErr) throw usersErr;

  const userMap = new Map<string, FriendUser>();
  for (const u of users ?? []) {
    userMap.set(u.id as string, {
      id: u.id as string,
      username: u.username as string,
      nickname: u.nickname as string,
    });
  }

  const requests: FriendRequest[] = [];
  for (const r of rows) {
    const requester = userMap.get(r.requester_id as string);
    if (!requester) continue;
    requests.push({
      friendshipId: r.id as string,
      requester,
      createdAt: r.created_at as string,
    });
  }

  return requests;
};

// 받은 요청 응답. addressee 본인만 가능. 수락 → accepted, 거절 → 행 삭제.
export const respondFriendRequest = async (
  friendshipId: string,
  userId: string,
  accept: boolean
): Promise<void> => {
  if (accept) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", responded_at: new Date().toISOString() })
      .eq("id", friendshipId)
      .eq("addressee_id", userId)
      .eq("status", "pending");

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .eq("addressee_id", userId);

    if (error) throw error;
  }
};

// 친구 삭제. 본인이 requester 또는 addressee 인 경우에만.
export const removeFriend = async (
  friendshipId: string,
  userId: string
): Promise<void> => {
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error) throw error;
};
