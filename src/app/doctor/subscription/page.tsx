"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BarChart3,
  CalendarCheck2,
  Check,
  ChevronRight,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  Stethoscope,
  Video,
  Wallet,
  X,
} from "lucide-react";

import {
  PRACTITIONER_MONTHLY_PRICE,
  PRACTITIONER_ANNUAL_PRICE,
  useSubscription,
  type SubscriptionPlan,
} from "@/store/subscription";

const features = [
  {
    icon: CalendarCheck2,
    title: "Appointment Management",
    description:
      "Manage consultations, schedules, and upcoming patient appointments.",
  },
  {
    icon: MessageCircle,
    title: "Patient Communication",
    description:
      "Communicate with assigned patients through TeleCare messaging.",
  },
  {
    icon: Video,
    title: "Telehealth Consultations",
    description:
      "Conduct secure simulated video consultations through the TeleCare platform.",
  },
  {
    icon: Stethoscope,
    title: "Clinical Tools",
    description:
      "Create clinical notes, prescriptions, treatment plans, and follow-up reminders.",
  },
  {
    icon: BarChart3,
    title: "Practice Insights",
    description:
      "Monitor consultations, patient activity, ratings, and practitioner earnings.",
  },
  {
    icon: Wallet,
    title: "Practitioner Earnings",
    description:
      "Receive 80% of completed consultation fees after the TeleCare platform fee.",
  },
];

function formatDate(date: string | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function DoctorSubscriptionPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("monthly");

  const status = useSubscription((state) => state.status);
  const plan = useSubscription((state) => state.plan);
  const activatedAt = useSubscription((state) => state.activatedAt);
  const renewalDate = useSubscription((state) => state.renewalDate);
  const activateSubscription = useSubscription(
    (state) => state.activateSubscription,
  );

  const isSubscribed = status === "active";

  const currentPrice =
    plan === "annual" ? PRACTITIONER_ANNUAL_PRICE : PRACTITIONER_MONTHLY_PRICE;

  const currentBilling = plan === "annual" ? "year" : "month";

  const selectedPrice =
    selectedPlan === "annual"
      ? PRACTITIONER_ANNUAL_PRICE
      : PRACTITIONER_MONTHLY_PRICE;

  const handleActivate = () => {
    activateSubscription(selectedPlan);
    setShowModal(false);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link
              href="/doctor/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 hover:text-[#114084]"
              aria-label="Back to doctor dashboard"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3566AB]">
                Practitioner
              </p>

              <h1 className="text-lg font-extrabold text-[#1C1C1C] sm:text-xl">
                Subscription
              </h1>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
              isSubscribed
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isSubscribed ? "bg-emerald-500" : "bg-slate-400"
              }`}
            />

            {isSubscribed ? "Active" : "Not subscribed"}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#114084] via-[#3566AB] to-[#83B7DE] p-6 text-white shadow-sm sm:p-8">
          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur">
              <BadgeCheck size={15} />
              TeleCare Practitioner Plan
            </div>

            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Everything you need to provide better digital care.
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
              Access TeleCare&apos;s practitioner tools for appointments,
              patient communication, consultations, clinical documentation, and
              practice insights.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white px-4 py-3 text-[#114084] shadow-sm">
                <p className="text-xs font-semibold text-slate-500">
                  Monthly plan
                </p>

                <p className="mt-0.5 text-xl font-extrabold">
                  ₱{PRACTITIONER_MONTHLY_PRICE.toLocaleString()}
                  <span className="text-sm font-semibold text-slate-500">
                    /month
                  </span>
                </p>
              </div>

              <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
                <p className="text-xs font-semibold text-blue-100">
                  Annual plan
                </p>

                <p className="mt-0.5 text-xl font-extrabold">
                  ₱{PRACTITIONER_ANNUAL_PRICE.toLocaleString()}
                  <span className="text-sm font-semibold text-blue-100">
                    /year
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-20 right-20 h-56 w-56 rounded-full bg-white/10" />
        </section>

        {/* Main grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Features */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#3566AB]">
                Included
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#1C1C1C]">
                Practitioner tools
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Everything included with your TeleCare practitioner
                subscription.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-[#83B7DE]/50 hover:bg-white"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1F1F1] text-[#3566AB]">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1C1C1C]">
                          {feature.title}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Subscription card */}
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#3566AB]">
                  Your plan
                </p>

                <h2 className="mt-1 text-lg font-extrabold text-[#1C1C1C]">
                  Practitioner
                </h2>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                {isSubscribed
                  ? plan === "annual"
                    ? "Annual subscription"
                    : "Monthly subscription"
                  : "Choose your subscription"}
              </p>

              <p className="mt-1 text-3xl font-extrabold tracking-tight text-[#114084]">
                ₱
                {isSubscribed
                  ? currentPrice.toLocaleString()
                  : PRACTITIONER_MONTHLY_PRICE.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {isSubscribed
                  ? `Billed ${currentBilling} in the prototype.`
                  : "Monthly and annual plans available."}
              </p>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm text-slate-600">
                  Access to practitioner features
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm text-slate-600">
                  Patient communication tools
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm text-slate-600">
                  Consultation and clinical tools
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <Check size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-sm text-slate-600">
                  Earnings and practice insights
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              disabled={isSubscribed}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                isSubscribed
                  ? "cursor-default bg-emerald-50 text-emerald-700"
                  : "bg-[#114084] text-white shadow-sm hover:bg-[#3566AB]"
              }`}
            >
              {isSubscribed ? (
                <>
                  <BadgeCheck size={18} />
                  Subscription Active
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  Activate Subscription
                </>
              )}
            </button>

            {isSubscribed && (
              <div className="mt-4 space-y-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-700/70">Plan</span>

                  <span className="font-bold capitalize text-emerald-800">
                    {plan}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-700/70">Activated</span>

                  <span className="font-bold text-emerald-800">
                    {formatDate(activatedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-emerald-700/70">Next renewal</span>

                  <span className="font-bold text-emerald-800">
                    {formatDate(renewalDate)}
                  </span>
                </div>
              </div>
            )}

            <p className="mt-3 text-center text-[11px] leading-4 text-slate-400">
              Prototype payment flow. No real payment will be processed.
            </p>
          </aside>
        </div>

        {/* Revenue split */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#3566AB]">
                Revenue sharing
              </p>

              <h2 className="mt-1 text-xl font-extrabold text-[#1C1C1C]">
                Keep 80% of your completed consultation fees
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                TeleCare retains a 20% platform commission from completed
                consultations. The remaining 80% is attributed to the
                practitioner in the earnings dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-700">80%</p>

                <p className="mt-1 text-xs font-semibold text-emerald-700/70">
                  Practitioner
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-slate-700">20%</p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  TeleCare
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Active status */}
        {isSubscribed && (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
                <BadgeCheck size={20} />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-extrabold text-emerald-900">
                  Your practitioner subscription is active
                </h2>

                <p className="mt-1 text-sm leading-5 text-emerald-800/80">
                  Your TeleCare practitioner features are now enabled for this
                  prototype session.
                </p>

                <Link
                  href="/doctor/dashboard"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-900"
                >
                  Return to dashboard
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Prototype notice */}
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-xs leading-5 text-slate-500">
            <span className="font-bold text-slate-700">Prototype notice:</span>{" "}
            Subscription activation is simulated for the current TeleCare
            prototype. Real payment processing, billing, invoices, and automatic
            renewals are not connected.
          </p>
        </div>
      </div>

      {/* Activation modal */}
      {showModal && !isSubscribed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                  <CreditCard size={20} />
                </div>

                <h2
                  id="subscription-modal-title"
                  className="mt-4 text-xl font-extrabold text-[#1C1C1C]"
                >
                  Activate Practitioner Plan
                </h2>

                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Choose a subscription plan to activate your TeleCare
                  practitioner account.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Plan selection */}
            <div className="mt-5">
              <p className="mb-3 text-sm font-bold text-slate-700">
                Choose your subscription
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("monthly")}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedPlan === "monthly"
                      ? "border-[#3566AB] bg-blue-50 ring-2 ring-[#3566AB]/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className="text-sm font-bold text-slate-700">Monthly</p>

                  <p className="mt-1 text-2xl font-extrabold text-[#114084]">
                    ₱{PRACTITIONER_MONTHLY_PRICE.toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Billed every month
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPlan("annual")}
                  className={`rounded-xl border p-4 text-left transition ${
                    selectedPlan === "annual"
                      ? "border-[#3566AB] bg-blue-50 ring-2 ring-[#3566AB]/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-700">Annual</p>

                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                      Best value
                    </span>
                  </div>

                  <p className="mt-1 text-2xl font-extrabold text-[#114084]">
                    ₱{PRACTITIONER_ANNUAL_PRICE.toLocaleString()}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Billed once per year
                  </p>
                </button>
              </div>
            </div>

            {/* Payment summary */}
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-600">
                  Selected plan
                </span>

                <span className="text-lg font-extrabold text-[#114084]">
                  ₱{selectedPrice.toLocaleString()}/
                  {selectedPlan === "annual" ? "yr" : "mo"}
                </span>
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payment</span>

                  <span className="font-semibold text-slate-700">
                    Simulated
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Billing</span>

                  <span className="font-semibold capitalize text-slate-700">
                    {selectedPlan}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50 p-3">
              <ShieldCheck
                size={17}
                className="mt-0.5 shrink-0 text-[#3566AB]"
              />

              <p className="text-xs leading-5 text-[#114084]">
                No real charge will be made. Activating this button only enables
                the practitioner subscription state in the prototype.
              </p>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleActivate}
                className="flex-1 rounded-xl bg-[#114084] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#3566AB]"
              >
                Confirm Activation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
