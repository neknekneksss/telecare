import { ChatMessage } from "@/lib/types";

// NOTE: this file is legacy/unused now that chat is Supabase-backed
// (see src/store/messages.ts). Kept only for type-shape reference.
export const messages: ChatMessage[] = [
  {
    id: "msg-1",
    patientId: "pat-2",
    doctorId: "doc-2",
    sender: "patient",
    text: "Doctor, I still have a mild headache after taking the prescribed medicine.",
    createdAt: "2026-09-19T08:00:00+08:00",
  },
  {
    id: "msg-2",
    patientId: "pat-2",
    doctorId: "doc-2",
    sender: "doctor",
    text: "Please continue monitoring your symptoms. If they worsen, schedule a follow-up consultation.",
    createdAt: "2026-09-19T08:05:00+08:00",
  },
];
