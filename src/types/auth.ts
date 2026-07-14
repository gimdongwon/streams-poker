export type User = {
  id: string;
  username: string;
  nickname: string;
  created_at: string;
  coins: number;
  // 익명 게스트 여부. true면 멀티/코인 등은 정식 승격 후에만 허용.
  is_guest: boolean;
};

export type AuthState = {
  user: User | null;
  isLoggedIn: boolean;
};
