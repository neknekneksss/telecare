"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HeartPulse,
  CalendarCheck,
  MessageSquare,
  FileText,
  UserPlus,
  Video,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    title: "Book a consultation",
    description:
      "Choose a doctor by specialty or availability and pick a time that works for you.",
  },
  {
    icon: Video,
    title: "Connect with your doctor",
    description:
      "Discuss your symptoms, get findings, and receive a prescription if needed.",
  },
  {
    icon: ClipboardList,
    title: "Track your care",
    description:
      "Keep an eye on medications, records, and follow-ups, all in one dashboard.",
  },
];

const features = [
  {
    icon: CalendarCheck,
    title: "Book Appointments",
    description:
      "Find the right doctor and schedule a consultation in a few clicks.",
  },
  {
    icon: MessageSquare,
    title: "Message Your Doctor",
    description: "Ask follow-up questions and get guidance between visits.",
  },
  {
    icon: FileText,
    title: "Track Your Records",
    description: "Medications, diagnoses, and history kept in one place.",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function handleGetStarted() {
    setExiting(true);
    setTimeout(() => router.push("/login"), 200);
  }

  return (
    <div
      className={`flex flex-col min-h-full transition-all duration-200 ease-in ${
        exiting ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
      }`}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-brand-dark text-white flex items-center justify-center">
            <HeartPulse size={16} />
          </span>
          <span className="font-semibold text-neutral-ink">Telecare</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium text-neutral-mid hover:text-brand-dark transition-colors"
        >
          Log In
        </Link>
      </nav>

      {/* Hero */}
      <main
        className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 gap-6"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(131,183,222,0.18) 0%, rgba(131,183,222,0) 70%)",
        }}
      >
        <h1
          className={`text-4xl sm:text-5xl font-bold text-brand-dark transition-all duration-700 ease-out ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Telecare
        </h1>
        <p
          className={`text-lg text-neutral-mid max-w-xl transition-all duration-700 ease-out delay-100 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Just a click away — book a consultation, talk to your doctor, and
          track your care, all in one place.
        </p>
        <button
          type="button"
          onClick={handleGetStarted}
          className={`group mt-2 flex items-center gap-2 bg-brand hover:bg-brand-dark text-white font-medium px-6 py-3 rounded-xl transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:shadow-lg ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: mounted ? "200ms" : "0ms" }}
        >
          Get Started
          <ArrowRight
            size={18}
            className="transition-all duration-300 -translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-active:translate-x-1"
          />
        </button>

        {/* How it works */}
        <div className="w-full max-w-4xl mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`flex flex-col items-center text-center gap-2 transition-all duration-700 ease-out ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: mounted ? `${300 + i * 100}ms` : "0ms",
              }}
            >
              <span className="w-10 h-10 rounded-full bg-brand-light/30 text-brand-dark flex items-center justify-center text-sm font-semibold">
                {i + 1}
              </span>
              <Icon size={20} className="text-brand-dark mt-1" />
              <p className="text-sm font-semibold text-neutral-ink">{title}</p>
              <p className="text-xs text-neutral-mid max-w-[220px]">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="w-full max-w-4xl mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, description }, i) => (
            <div
              key={title}
              className={`bg-white border border-neutral-off rounded-2xl p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                mounted
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
              style={{
                transitionDelay: mounted ? `${600 + i * 100}ms` : "0ms",
              }}
            >
              <span className="w-9 h-9 rounded-xl bg-brand-light/30 text-brand-dark flex items-center justify-center mb-3">
                <Icon size={18} />
              </span>
              <p className="text-sm font-semibold text-neutral-ink">{title}</p>
              <p className="text-xs text-neutral-mid mt-1">{description}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-neutral-mid py-6">
        Telecare — interactive prototype
      </footer>
    </div>
  );
}
