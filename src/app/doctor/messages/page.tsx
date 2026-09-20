"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Phone,
  Video,
  MessageCircle,
  ChevronLeft,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useMessages } from "@/store/messages";
import { useMessageReads } from "@/store/messageReads";
import { appointments } from "@/lib/mock-data/appointments";
import { supabase } from "@/lib/supabase";
import CallModal from "@/components/CallModal";

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DoctorMessagesPage() {
  const router = useRouter();
  const { role, userId } = useSession();
  const { patients } = useUsers();

  const messages = useMessages((s) => s.messages);
  const loading = useMessages((s) => s.loading);
  const loadConversation = useMessages((s) => s.loadConversation);
  const subscribeToConversation = useMessages((s) => s.subscribeToConversation);
  const addMessage = useMessages((s) => s.addMessage);

  const markRead = useMessageReads((s) => s.markRead);

  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    null,
  );

  const [hasInitializedPatient, setHasInitializedPatient] = useState(false);

  const [draft, setDraft] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [messagedPatientIds, setMessagedPatientIds] = useState<string[]>([]);

  const [callType, setCallType] = useState<"phone" | "video" | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role !== "doctor" || !userId) {
      router.replace("/login");
    }
  }, [role, userId, router]);

  /*
   * Load patients that have either:
   * - an appointment with this doctor
   * - an existing message conversation with this doctor
   */
  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    async function loadMessagedPatients() {
      const { data, error } = await supabase
        .from("telecare_messages")
        .select("patient_id")
        .eq("doctor_id", userId);

      if (cancelled) return;

      if (error) {
        console.error("Failed to load conversation partners:", error);
        return;
      }

      const ids = Array.from(new Set((data ?? []).map((r) => r.patient_id)));

      setMessagedPatientIds(ids);
    }

    loadMessagedPatients();

    const channel = supabase
      .channel(`doctor-patient-list-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "telecare_messages",
          filter: `doctor_id=eq.${userId}`,
        },
        (payload) => {
          const patientId = (payload.new as { patient_id: string }).patient_id;

          setMessagedPatientIds((current) => {
            if (current.includes(patientId)) return current;

            return [...current, patientId];
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /*
   * Combine appointment patients + patients who have messaged the doctor.
   */
  const myPatientIds = useMemo(() => {
    const fromAppointments = appointments
      .filter((appointment) => appointment.doctorId === userId)
      .map((appointment) => appointment.patientId);

    return Array.from(new Set([...fromAppointments, ...messagedPatientIds]));
  }, [userId, messagedPatientIds]);

  /*
   * Automatically open the first patient only once.
   *
   * This is important for desktop convenience while allowing the
   * mobile Back button to return to the patient list.
   */
  useEffect(() => {
    if (hasInitializedPatient) return;
    if (myPatientIds.length === 0) return;

    setSelectedPatientId(myPatientIds[0]);
    setHasInitializedPatient(true);
  }, [myPatientIds, hasInitializedPatient]);

  /*
   * Load + subscribe to the selected patient conversation.
   */
  useEffect(() => {
    if (!userId || !selectedPatientId) return;

    loadConversation(selectedPatientId, userId);
    subscribeToConversation(selectedPatientId, userId);
  }, [userId, selectedPatientId, loadConversation, subscribeToConversation]);

  /*
   * Mark the newest message as read.
   */
  useEffect(() => {
    if (!userId || !selectedPatientId || messages.length === 0) return;

    const newest = messages[messages.length - 1];

    markRead(selectedPatientId, userId, newest.createdAt);
  }, [userId, selectedPatientId, messages, markRead]);

  /*
   * Scroll to newest message.
   */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId),
    [patients, selectedPatientId],
  );

  async function handleSend() {
    if (!draft.trim() || !userId || !selectedPatientId) return;

    setSendError(null);

    const text = draft;
    setDraft("");

    const { error } = await addMessage({
      patientId: selectedPatientId,
      doctorId: userId,
      sender: "doctor",
      text,
    });

    if (error) {
      setSendError(
        "Message failed to send. Check your connection and try again.",
      );

      setDraft(text);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (role !== "doctor" || !userId) return null;

  let lastDay = "";

  return (
    <>
      <main className="page-enter flex h-[calc(100dvh-72px)] min-h-0 w-full overflow-hidden bg-slate-50">
        <div className="mx-auto flex min-h-0 w-full max-w-6xl overflow-hidden border-x border-slate-200 bg-white shadow-sm">
          {/* PATIENT LIST */}
          <aside
            className={`
              flex w-full shrink-0 flex-col bg-white
              md:w-64 md:border-r md:border-slate-200
              ${selectedPatientId ? "hidden md:flex" : "flex"}
            `}
          >
            {/* List Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-4">
              <button
                onClick={() => router.push("/doctor/dashboard")}
                className="telecare-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Back to dashboard"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="min-w-0">
                <h1 className="text-sm font-bold text-slate-900">Messages</h1>

                <p className="text-xs text-slate-500">Your patients</p>
              </div>
            </div>

            {/* Patient List */}
            <div className="custom-scrollbar flex-1 overflow-y-auto">
              {myPatientIds.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#3566AB]">
                    <MessageCircle size={21} />
                  </div>

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No conversations yet
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                    Patients will appear here once you have an appointment or
                    message conversation with them.
                  </p>
                </div>
              )}

              {myPatientIds.map((pid) => {
                const patient = patients.find((p) => p.id === pid);
                const isActive = pid === selectedPatientId;

                return (
                  <button
                    key={pid}
                    onClick={() => {
                      setSelectedPatientId(pid);
                      setDraft("");
                      setSendError(null);
                    }}
                    className={`
                      flex w-full items-center gap-3 border-b border-slate-100
                      px-4 py-3.5 text-left transition-colors
                      ${
                        isActive
                          ? "bg-blue-50"
                          : "hover:bg-slate-50 active:bg-slate-100"
                      }
                    `}
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                      style={{
                        backgroundColor: patient?.avatarColor ?? "#808080",
                      }}
                    >
                      {patient?.name?.[0] ?? "?"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {patient?.name ?? "Unknown Patient"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {patient?.email ?? "Patient"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* CONVERSATION */}
          <section
            className={`
              min-w-0 flex-1 flex-col
              ${selectedPatientId ? "flex" : "hidden md:flex"}
            `}
          >
            {!selectedPatientId ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#3566AB]">
                  <MessageCircle size={28} />
                </div>

                <h2 className="mt-4 text-base font-bold text-slate-800">
                  Patient messages
                </h2>

                <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">
                  Select a patient to view your conversation.
                </p>
              </div>
            ) : (
              <>
                {/* CONVERSATION HEADER */}
                <header className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-white px-3 py-3 sm:px-5">
                  {/* Mobile Back */}
                  <button
                    onClick={() => {
                      setSelectedPatientId(null);
                      setDraft("");
                      setSendError(null);
                    }}
                    className="telecare-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:hidden"
                    aria-label="Back to patients"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Avatar */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm"
                    style={{
                      backgroundColor:
                        selectedPatient?.avatarColor ?? "#3566AB",
                    }}
                  >
                    {selectedPatient?.name?.[0] ?? "P"}
                  </div>

                  {/* Patient Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {selectedPatient?.name ?? "Patient"}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <span className="status-dot bg-emerald-500" />

                      <p className="truncate text-xs text-slate-500">Patient</p>
                    </div>
                  </div>

                  {/* Call Buttons */}
                  <button
                    type="button"
                    onClick={() => setCallType("phone")}
                    className="telecare-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Start simulated phone call"
                    aria-label="Start simulated phone call"
                  >
                    <Phone size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCallType("video")}
                    className="telecare-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Start simulated video call"
                    aria-label="Start simulated video call"
                  >
                    <Video size={18} />
                  </button>
                </header>

                {/* MESSAGES */}
                <div
                  ref={scrollRef}
                  className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-50 px-3 py-5 sm:px-5"
                >
                  {loading && messages.length === 0 && (
                    <div className="flex h-full items-center justify-center">
                      <div className="rounded-full bg-white px-4 py-2 text-xs text-slate-500 shadow-sm">
                        Loading conversation…
                      </div>
                    </div>
                  )}

                  {!loading && messages.length === 0 && (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#3566AB]">
                        <MessageCircle size={21} />
                      </div>

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No messages yet
                      </p>

                      <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                        Start a conversation with{" "}
                        {selectedPatient?.name ?? "this patient"}.
                      </p>
                    </div>
                  )}

                  <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
                    {messages.map((m) => {
                      const label = dayLabel(m.createdAt);
                      const showSeparator = label !== lastDay;

                      lastDay = label;

                      const isMine = m.sender === "doctor";

                      return (
                        <div key={m.id} className="message-enter">
                          {showSeparator && (
                            <div className="my-5 flex items-center gap-3">
                              <div className="h-px flex-1 bg-slate-200" />

                              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-medium text-slate-400 shadow-sm">
                                {label}
                              </span>

                              <div className="h-px flex-1 bg-slate-200" />
                            </div>
                          )}

                          <div
                            className={`flex ${
                              isMine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`
                                max-w-[85%] px-3.5 py-2.5 text-sm
                                leading-5 shadow-sm sm:max-w-[70%]
                                ${
                                  isMine
                                    ? "rounded-2xl rounded-br-md bg-[#3566AB] text-white"
                                    : "rounded-2xl rounded-bl-md border border-slate-200 bg-white text-slate-800"
                                }
                              `}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {m.text}
                              </p>

                              <div
                                className={`
                                  mt-1 text-[10px]
                                  ${isMine ? "text-white/65" : "text-slate-400"}
                                `}
                              >
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* COMPOSER */}
                <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
                  <div className="mx-auto w-full max-w-3xl">
                    {sendError && (
                      <div className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                        {sendError}
                      </div>
                    )}

                    <div className="flex items-end gap-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        placeholder="Write a message…"
                        className="telecare-input min-h-[42px] max-h-32 flex-1 resize-none rounded-xl bg-slate-50 py-2.5"
                      />

                      <button
                        onClick={handleSend}
                        disabled={!draft.trim()}
                        className="telecare-button flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#3566AB] text-white shadow-sm hover:bg-[#114084] disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label="Send message"
                      >
                        <Send size={17} />
                      </button>
                    </div>

                    <p className="mt-1.5 hidden text-[10px] text-slate-400 sm:block">
                      Enter to send · Shift + Enter for a new line
                    </p>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {selectedPatient && callType && (
        <CallModal
          open={Boolean(callType)}
          type={callType}
          participantName={selectedPatient.name}
          participantRole="Patient"
          participantInitial={selectedPatient.name?.[0]}
          onClose={() => setCallType(null)}
        />
      )}
    </>
  );
}
