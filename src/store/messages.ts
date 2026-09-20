import { create } from "zustand";
import { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { ChatMessage, Role } from "@/lib/types";

interface MessageRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  sender: Role;
  text: string;
  created_at: string;
}

function rowToMessage(row: MessageRow): ChatMessage {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    sender: row.sender,
    text: row.text,
    createdAt: row.created_at,
  };
}

interface MessagesState {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  channel: RealtimeChannel | null;
  activeConversation: string | null; // `${patientId}-${doctorId}`

  loadConversation: (patientId: string, doctorId: string) => Promise<void>;
  subscribeToConversation: (patientId: string, doctorId: string) => void;
  addMessage: (params: {
    patientId: string;
    doctorId: string;
    sender: Role;
    text: string;
  }) => Promise<{ error: string | null }>;
  unsubscribe: () => void;
}

export const useMessages = create<MessagesState>((set, get) => ({
  messages: [],
  loading: false,
  error: null,
  channel: null,
  activeConversation: null,

  loadConversation: async (patientId, doctorId) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase
      .from("telecare_messages")
      .select("*")
      .eq("patient_id", patientId)
      .eq("doctor_id", doctorId)
      .order("created_at", { ascending: true });

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    set({
      messages: ((data as MessageRow[]) ?? []).map(rowToMessage),
      loading: false,
    });
  },

  subscribeToConversation: (patientId, doctorId) => {
    const key = `${patientId}-${doctorId}`;
    if (get().activeConversation === key && get().channel) return; // already subscribed

    get().unsubscribe();

    const channel = supabase
      .channel(`telecare-messages-${key}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telecare_messages",
          filter: `patient_id=eq.${patientId}`,
        },
        (payload) => {
          const row = payload.new as MessageRow;
          if (row.doctor_id !== doctorId) return; // different conversation

          set((s) => {
            if (s.messages.some((m) => m.id === row.id)) return s;
            return { messages: [...s.messages, rowToMessage(row)] };
          });
        },
      )
      .subscribe();

    set({ channel, activeConversation: key });
  },

  addMessage: async ({ patientId, doctorId, sender, text }) => {
    if (!text.trim()) return { error: null };
    const { error } = await supabase.from("telecare_messages").insert({
      patient_id: patientId,
      doctor_id: doctorId,
      sender,
      text: text.trim(),
    });
    // Deliberately not pushing to local state here — the Realtime
    // INSERT event (above) adds it, so sender and receiver both get
    // the message the same way and we never double-render it.
    return { error: error?.message ?? null };
  },

  unsubscribe: () => {
    const channel = get().channel;
    if (channel) {
      supabase.removeChannel(channel);
    }
    set({ channel: null, activeConversation: null });
  },
}));
