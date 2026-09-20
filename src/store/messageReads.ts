import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MessageReadsState {
  lastReadAt: Record<string, string>; // key: `${patientId}-${doctorId}` -> ISO timestamp
  markRead: (patientId: string, doctorId: string, timestamp: string) => void;
  getLastReadAt: (patientId: string, doctorId: string) => string | undefined;
}

export const useMessageReads = create<MessageReadsState>()(
  persist(
    (set, get) => ({
      lastReadAt: {},
      markRead: (patientId, doctorId, timestamp) =>
        set((s) => ({
          lastReadAt: {
            ...s.lastReadAt,
            [`${patientId}-${doctorId}`]: timestamp,
          },
        })),
      getLastReadAt: (patientId, doctorId) =>
        get().lastReadAt[`${patientId}-${doctorId}`],
    }),
    { name: "telecare-message-reads" },
  ),
);
