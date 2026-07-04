"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";
import { TierBadge } from "@/components/common/TierBadge";
import { Spinner } from "@/components/common/Spinner";
import { useAuthStore } from "@/stores/authStore";
import type { Friend, FriendRequest } from "@/lib/friends";
import { useT } from "@/lib/i18n/useT";

type FriendsPanelProps = {
  // 미지정 시 authStore 의 현재 유저 사용
  userId?: string;
};

type Message = { kind: "ok" | "error"; text: string } | null;

export const FriendsPanel = ({ userId: userIdProp }: FriendsPanelProps) => {
  const authUserId = useAuthStore((s) => s.user?.id);
  const userId = userIdProp ?? authUserId;
  const t = useT();

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
        setMessage({ kind: "ok", text: t("friends.msg.sent") });
        setUsernameInput("");
        refresh();
      } else {
        setMessage({
          kind: "error",
          text: data.error ?? t("friends.msg.requestFailed"),
        });
      }
    } catch {
      setMessage({ kind: "error", text: t("friends.msg.serverFailed") });
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
        setMessage({ kind: "error", text: data.error ?? t("friends.msg.respondFailed") });
      }
    } catch {
      setMessage({ kind: "error", text: t("friends.msg.serverFailed") });
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
        setMessage({ kind: "error", text: data.error ?? t("friends.msg.removeFailed") });
      }
    } catch {
      setMessage({ kind: "error", text: t("friends.msg.serverFailed") });
    } finally {
      setBusy(friendshipId, false);
    }
  };

  return (
    <div className="bg-panel border border-edge rounded-2xl p-4 w-full">
      <h2 className="text-snow font-bold text-base mb-3 flex items-center gap-2">
        <span>👥</span> {t("friends.title")}
      </h2>

      {/* 1) 친구 추가 */}
      <section className="mb-4">
        <h3 className="text-haze text-[10px] tracking-[2px] uppercase font-bold mb-2">
          {t("friends.add.title")}
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
            }}
            placeholder={t("friends.add.placeholder")}
            className="flex-1 min-w-0 px-3 py-2 bg-void border border-edge rounded-lg text-snow text-sm placeholder-haze/60 focus:outline-none focus:border-neon-cyan transition-colors"
            aria-label={t("friends.add.inputAria")}
          />
          <button
            onClick={handleAdd}
            disabled={sending || !usernameInput.trim()}
            className="shrink-0 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/60 text-neon-cyan text-sm font-bold rounded-lg transition-all active:scale-95 hover:bg-neon-cyan/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[3.25rem]"
            aria-label={t("friends.add.buttonAria")}
          >
            {sending ? <Spinner size="sm" /> : t("friends.add.button")}
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
          {t("friends.requests.title")}
          {requests.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-neon-magenta text-void text-[10px] font-bold">
              {requests.length}
            </span>
          )}
        </h3>
        {loading && requests.length === 0 ? (
          <div className="flex items-center gap-2 text-haze text-xs py-1">
            <Spinner size="sm" />
            {t("common.loading")}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-haze text-xs">{t("friends.requests.empty")}</p>
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
                    aria-label={t("friends.requests.accept")}
                  >
                    {busyIds.has(req.friendshipId) ? <Spinner size="sm" /> : t("friends.requests.accept")}
                  </button>
                  <button
                    onClick={() => handleRespond(req.friendshipId, false)}
                    disabled={busyIds.has(req.friendshipId)}
                    className="px-2.5 py-1 bg-edge border border-edge text-haze text-xs font-medium rounded-lg transition-all active:scale-95 hover:text-snow disabled:opacity-50"
                    aria-label={t("friends.requests.reject")}
                  >
                    {t("friends.requests.reject")}
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
          {t("friends.list.title")}
          {friends.length > 0 && (
            <span className="ml-2 text-haze/70 font-normal">
              {friends.length}
            </span>
          )}
        </h3>
        {loading && friends.length === 0 ? (
          <div className="bg-void border border-edge rounded-lg py-8 flex items-center justify-center gap-2 text-haze text-sm">
            <Spinner size="sm" />
            {t("common.loading")}
          </div>
        ) : friends.length === 0 ? (
          <div className="bg-void border border-edge rounded-lg py-8 text-center text-haze text-sm">
            {t("friends.list.empty")}
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
                      {t("friends.list.total", { n: friend.totalScore.toLocaleString() })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(friend.friendshipId)}
                  disabled={busyIds.has(friend.friendshipId)}
                  className="shrink-0 px-2.5 py-1 text-haze hover:text-red-400 text-xs font-medium rounded-lg transition-colors active:scale-95 disabled:opacity-50 flex items-center justify-center min-w-[2.5rem]"
                  aria-label={t("friends.list.removeAria", { nick: friend.nickname })}
                >
                  {busyIds.has(friend.friendshipId) ? (
                    <Spinner size="sm" colorClassName="border-haze" />
                  ) : (
                    t("friends.list.remove")
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
