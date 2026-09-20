"use client";

import { useEffect, useState } from "react";
import {
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Volume2,
  X,
} from "lucide-react";

type CallType = "phone" | "video";

interface CallModalProps {
  open: boolean;
  type: CallType;
  participantName: string;
  participantRole: string;
  participantInitial?: string;
  onClose: () => void;
}

export default function CallModal({
  open,
  type,
  participantName,
  participantRole,
  participantInitial,
  onClose,
}: CallModalProps) {
  const [callState, setCallState] = useState<"connecting" | "connected">(
    "connecting",
  );
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCallState("connecting");
    setElapsedSeconds(0);
    setIsMuted(false);
    setIsCameraOff(false);

    const connectionTimer = window.setTimeout(() => {
      setCallState("connected");
    }, 1200);

    return () => {
      window.clearTimeout(connectionTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open || callState !== "connected") return;

    const timer = window.setInterval(() => {
      setElapsedSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [open, callState]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  const initials =
    participantInitial ||
    participantName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  if (type === "phone") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close call"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold shadow-lg shadow-blue-600/30">
                {initials}
              </div>

              <h2 className="text-xl font-bold">{participantName}</h2>

              <p className="mt-1 text-sm text-slate-400">{participantRole}</p>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                {callState === "connecting" ? (
                  <>
                    <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                    <span className="text-slate-300">Calling...</span>
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">
                      Connected · {minutes}:{seconds}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="mt-auto flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsMuted((current) => !current)}
                disabled={callState !== "connected"}
                aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                className={`flex h-14 w-14 items-center justify-center rounded-full transition ${
                  isMuted
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white hover:bg-white/20"
                } disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="End call"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              <button
                type="button"
                disabled={callState !== "connected"}
                aria-label="Speaker"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-8 text-center text-[11px] text-slate-500">
              Demo call · Audio is simulated for this prototype
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 p-3 backdrop-blur-sm sm:p-5">
      <div className="relative flex h-full w-full flex-col overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl">
        <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 text-xs font-medium text-slate-200 backdrop-blur">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          TeleCare Demo Call
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close call"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-slate-300 backdrop-blur transition hover:bg-black/60 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-950">
          <div className="flex flex-col items-center justify-center text-center">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold shadow-2xl shadow-blue-600/30 transition ${
                callState === "connecting" ? "animate-pulse" : ""
              }`}
            >
              {initials}
            </div>

            <h2 className="mt-5 text-xl font-bold">{participantName}</h2>

            <p className="mt-1 text-sm text-slate-400">{participantRole}</p>

            <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
              {callState === "connecting" ? (
                <>
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />
                  Connecting...
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Connected · {minutes}:{seconds}
                </>
              )}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/10 bg-slate-800 shadow-xl sm:bottom-5 sm:right-5 sm:h-36 sm:w-52">
            {isCameraOff ? (
              <div className="flex h-full flex-col items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-sm font-bold">
                  You
                </div>

                <span className="mt-2 text-[10px] text-slate-400">
                  Camera off
                </span>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-slate-800">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-sm font-bold">
                  You
                </div>

                <span className="mt-2 text-[10px] text-slate-400">
                  Camera preview
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-slate-900 px-4 py-5">
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsMuted((current) => !current)}
              disabled={callState !== "connected"}
              aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                isMuted
                  ? "bg-white text-slate-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCameraOff((current) => !current)}
              disabled={callState !== "connected"}
              aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
                isCameraOff
                  ? "bg-white text-slate-900"
                  : "bg-white/10 text-white hover:bg-white/20"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {isCameraOff ? (
                <CameraOff className="h-5 w-5" />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="End video call"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 transition hover:bg-red-600"
            >
              <PhoneOff className="h-6 w-6" />
            </button>

            <button
              type="button"
              disabled={callState !== "connected"}
              aria-label="Audio settings"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Volume2 className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close call"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <Phone className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] text-slate-500">
            Simulated video call · Camera and microphone are not connected
          </p>
        </div>
      </div>
    </div>
  );
}
