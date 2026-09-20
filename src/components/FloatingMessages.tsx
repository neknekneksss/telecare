"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useMessages } from "@/store/messages";
import { useUnreadCount } from "@/lib/useUnreadCount";
import { useAssignedDoctorId } from "@/lib/useAssignedDoctorId";

export function FloatingMessageButton({ patientId }: { patientId: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const doctorId = useAssignedDoctorId(patientId);

  const messages = useMessages((s) => s.messages);
  const loadConversation = useMessages((s) => s.loadConversation);
  const subscribeToConversation = useMessages((s) => s.subscribeToConversation);

  useEffect(() => {
    if (!doctorId) return;

    loadConversation(patientId, doctorId);
    subscribeToConversation(patientId, doctorId);
  }, [patientId, doctorId, loadConversation, subscribeToConversation]);

  const unreadCount = useUnreadCount(
    messages,
    patientId,
    doctorId ?? "",
    "patient",
  );

  if (pathname === "/patient/messages") {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push("/patient/messages")}
      className="fixed bottom-6 right-6 z-[99999] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition-all duration-200 hover:bg-brand-dark hover:scale-105 active:scale-95"
      aria-label="Open messages"
    >
      <MessageCircle size={24} />

      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
