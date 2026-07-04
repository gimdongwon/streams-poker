export type User = {
  id: string;
  username: string;
  nickname: string;
  created_at: string;
  coins: number;
};

export type AuthState = {
  user: User | null;
  isLoggedIn: boolean;
};
