import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Role } from "@/lib/types";

interface SessionState {
  role: Role | null;
  userId: string | null;
  login: (role: Role, userId: string) => void;
  logout: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      role: null,
      userId: null,
      login: (role, userId) => set({ role, userId }),
      logout: () => set({ role: null, userId: null }),
    }),
    { name: "telecare-session" }
  )
);
