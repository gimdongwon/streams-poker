"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { TierBadge } from "@/components/common/TierBadge";
import { Spinner } from "@/components/common/Spinner";
import { useAuthStore } from "@/stores/authStore";
import type { Friend, FriendRequest } from "@/lib/friends";

type FriendsPanelProps = {
  // 미지정 시 authStore 의 현재 유저 사용
  userId?: string;
};

type Message = { kind: "ok" | "error"; text: string } | null;

export const FriendsPanel = ({ userId: userIdProp }: FriendsPanelProps) => {
  const authUserId = useAuthStore((s) => s.user?.id);
  const userId = userIdProp ?? authUserId;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [usernameInput, setUsernameInput] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<Message>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetchWithTimeout(`/api/friends?userId=${encodeURIComponent(userId)}`),
        fetchWithTimeout(
          `/api/friends/requests?userId=${encodeURIComponent(userId)}`
        ),
      ]);
      if (friendsRes.ok) {
        const data: Friend[] = await friendsRes.json();
        setFriends(data);
      }
      if (requestsRes.ok) {
        const data: FriendRequest[] = await requestsRes.json();
        setRequests(data);
      }
    } catch {
      // 네트워크/DB 실패 시 조용히 무시 (graceful)
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async () => {
    const username = usernameInput.trim();
    if (!username || !userId || sending) return;
    setSending(true);
    setMessage(null);
    try {
      const res = await fetchWithTimeout("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ kind: "ok", text: "요청을 보냈어요" });
        setUsernameInput("");
        refresh();
      } else {
        setMessage({
          kind: "error",
          text: data.error ?? "친구 요청에 실패했어요",
        });
      }
    } catch {
      setMessage({ kind: "error", text: "서버 연결에 실패했어요" });
    } finally {
      setSending(false);
    }
  };

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    if (!userId || busyIds.has(friendshipId)) return;
    setBusy(friendshipId, true);
    try {
      const res = await fetchWithTimeout("/api/friends/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, userId, accept }),
      });
      if (res.ok) {
        refresh();
      } else {
        const data = await res.json();
        setMessage({ kind: "error", text: data.error ?? "처리에 실패했어요" });
      }
    } catch {
      setMessage({ kind: "error", text: "서버 연결에 실패했어요" });
    } finally {
      setBusy(friendshipId, false);
    }
  };

  const handleRemove = async (friendshipId: string) => {
    if (!userId || busyIds.has(friendshipId)) return;
    setBusy(friendshipId, true);
    try {
      const res = await fetchWithTimeout("/api/friends", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, userId }),
      });
      if (res.ok) {
        refresh();
      } else {
        const data = await res.json();
        setMessage({ kind: "error", text: data.error ?? "삭제에 실패했어요" });
      }
    } catch {
      setMessage({ kind: "error", text: "서버 연결에 실패했어요" });
    } finally {
      setBusy(friendshipId, false);
    }
  };

  return (
    <div className="bg-panel border border-edge rounded-2xl p-4 w-full">
      <h2 className="text-snow font-bold text-base mb-3 flex items-center gap-2">
        <span>👥</span> 친구
      </h2>

      {/* 1) 친구 추가 */}
      <section className="mb-4">
        <h3 className="text-haze text-[10px] tracking-[2px] uppercase font-bold mb-2">
          친구 추가
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder="아이디 입력"
            className="flex-1 min-w-0 px-3 py-2 bg-void border border-edge rounded-lg text-snow text-sm placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors"
            aria-label="친구 아이디 입력"
          />
          <button
            onClick={handleAdd}
            disabled={sending || !usernameInput.trim()}
            className="shrink-0 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/60 text-neon-cyan text-sm font-bold rounded-lg transition-all active:scale-95 hover:bg-neon-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3.25rem]"
            aria-label="친구 추가"
          >
            {sending ? <Spinner size="sm" /> : "추가"}
          </button>
        </div>
        {message && (
          <p
            className={`mt-2 text-xs ${
              message.kind === "ok" ? "text-neon-cyan" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      {/* 2) 받은 요청 */}
      <section className="mb-4">
        <h3 className="text-haze text-[10px] tracking-[2px] uppercase font-bold mb-2 flex items-center gap-2">
          받은 요청
          {requests.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-neon-magenta text-void text-[10px] font-bold">
              {requests.length}
            </span>
          )}
        </h3>
        {loading && requests.length === 0 ? (
          <div className="flex items-center gap-2 text-haze text-xs py-1">
            <Spinner size="sm" />
            불러오는 중...
          </div>
        ) : requests.length === 0 ? (
          <p className="text-haze text-xs">받은 요청이 없어요</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
            {requests.map((req) => (
              <div
                key={req.friendshipId}
                className="flex items-center justify-between gap-2 bg-void border border-edge rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-snow text-sm font-medium truncate">
                    {req.requester.nickname}
                  </p>
                  <p className="text-haze text-[10px] truncate">
                    @{req.requester.username}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleRespond(req.friendshipId, true)}
                    disabled={busyIds.has(req.friendshipId)}
                    className="px-2.5 py-1 bg-neon-cyan/10 border border-neon-cyan/60 text-neon-cyan text-xs font-bold rounded-lg transition-all active:scale-95 hover:bg-neon-cyan/20 disabled:opacity-50 flex items-center justify-center min-w-[2.75rem]"
                    aria-label="수락"
                  >
                    {busyIds.has(req.friendshipId) ? <Spinner size="sm" /> : "수락"}
                  </button>
                  <button
                    onClick={() => handleRespond(req.friendshipId, false)}
                    disabled={busyIds.has(req.friendshipId)}
                    className="px-2.5 py-1 bg-edge border border-edge text-haze text-xs font-medium rounded-lg transition-all active:scale-95 hover:text-snow disabled:opacity-50"
                    aria-label="거절"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3) 친구 목록 */}
      <section>
        <h3 className="text-haze text-[10px] tracking-[2px] uppercase font-bold mb-2">
          친구 목록
          {friends.length > 0 && (
            <span className="ml-2 text-haze/70 font-normal">
              {friends.length}
            </span>
          )}
        </h3>
        {loading && friends.length === 0 ? (
          <div className="bg-void border border-edge rounded-lg py-8 flex items-center justify-center gap-2 text-haze text-sm">
            <Spinner size="sm" />
            불러오는 중...
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-void border border-edge rounded-lg py-8 text-center text-haze text-sm">
            아직 친구가 없어요
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
            {friends.map((friend) => (
              <div
                key={friend.friendshipId}
                className="flex items-center justify-between gap-2 bg-void border border-edge rounded-lg px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-snow text-sm font-medium truncate">
                      {friend.nickname}
                    </p>
                    <TierBadge totalScore={friend.totalScore} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-haze text-[10px] truncate">
                      @{friend.username}
                    </p>
                    <span className="text-haze/50 text-[10px]">·</span>
                    <p className="text-neon-cyan text-[10px] font-medium">
                      누적 {friend.totalScore.toLocaleString()}점
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(friend.friendshipId)}
                  disabled={busyIds.has(friend.friendshipId)}
                  className="shrink-0 px-2.5 py-1 text-haze hover:text-red-400 text-xs font-medium rounded-lg transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[2.5rem]"
                  aria-label={`${friend.nickname} 친구 삭제`}
                >
                  {busyIds.has(friend.friendshipId) ? (
                    <Spinner size="sm" colorClassName="border-haze" />
                  ) : (
                    "삭제"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
