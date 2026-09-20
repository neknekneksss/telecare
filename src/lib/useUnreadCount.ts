import { useMemo } from "react";
import { ChatMessage, Role } from "@/lib/types";
import { useMessageReads } from "@/store/messageReads";

/**
 * Unread count for the *other* party's messages only.
 * A patient never sees their own sent messages counted as unread,
 * and vice versa — this is the fix for the bug described in the
 * handoff doc where sending a message incorrectly bumped the badge.
 */
export function useUnreadCount(
  messages: ChatMessage[],
  patientId: string,
  doctorId: string,
  viewerRole: Role,
) {
  const lastReadAt = useMessageReads((s) =>
    s.getLastReadAt(patientId, doctorId),
  );

  return useMemo(() => {
    const otherPartyRole: Role =
      viewerRole === "patient" ? "doctor" : "patient";
    const cutoff = lastReadAt ? new Date(lastReadAt).getTime() : 0;

    return messages.filter(
      (m) =>
        m.sender === otherPartyRole && new Date(m.createdAt).getTime() > cutoff,
    ).length;
  }, [messages, lastReadAt, viewerRole]);
}
