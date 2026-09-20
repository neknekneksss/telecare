"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  Wallet,
} from "lucide-react";
import { useMemo } from "react";

import { useSession } from "@/store/session";
import { useAppointments } from "@/store/appointments";
import { useUsers } from "@/store/users";

const TELECARE_COMMISSION_RATE = 0.2;
const PRACTITIONER_SHARE_RATE = 0.8;

const DEFAULT_CONSULTATION_FEE = 800;

export default function DoctorEarningsPage() {
  const { role, userId } = useSession();

  const appointments = useAppointments((state) => state.appointments);
  const patients = useUsers((state) => state.patients);

  const doctorAppointments = useMemo(() => {
    if (!userId) {
      return [];
    }

    return appointments
      .filter(
        (appointment) =>
          appointment.doctorId === userId && appointment.status === "completed",
      )
      .sort(
        (a, b) =>
          new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
      );
  }, [appointments, userId]);

  /*
   * Earnings are calculated directly from the consultation fee
   * stored on each appointment.
   *
   * Existing appointments without a stored fee temporarily use
   * the prototype default of ₱800.
   */
  const earnings = useMemo(() => {
    return doctorAppointments.map((appointment) => {
      const gross = appointment.consultationFee ?? DEFAULT_CONSULTATION_FEE;

      const commission = gross * TELECARE_COMMISSION_RATE;

      const practitionerShare = gross * PRACTITIONER_SHARE_RATE;

      const patient = patients.find(
        (item) => item.id === appointment.patientId,
      );

      return {
        appointment,
        patient,
        gross,
        commission,
        practitionerShare,
      };
    });
  }, [doctorAppointments, patients]);

  const totals = useMemo(() => {
    return earnings.reduce(
      (summary, earning) => ({
        gross: summary.gross + earning.gross,
        commission: summary.commission + earning.commission,
        practitioner: summary.practitioner + earning.practitionerShare,
      }),
      {
        gross: 0,
        commission: 0,
        practitioner: 0,
      },
    );
  }, [earnings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateTime: string) => {
    return new Date(dateTime).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (role !== "doctor" || !userId) {
    return (
      <main className="min-h-screen bg-[#F1F1F1] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md w-full">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#3566AB]/10 text-[#3566AB] flex items-center justify-center">
            <Wallet className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold text-[#1C1C1C] mt-4">
            Doctor session not found
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Please log in using a doctor account to view your earnings.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 mt-6 rounded-xl bg-[#3566AB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#114084] transition"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F1F1F1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER */}
        <div className="mb-7">
          <Link
            href="/doctor/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-[#3566AB] transition mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#3566AB]">
                Practitioner Portal
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1C1C] mt-1">
                Earnings
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Track consultation revenue, TeleCare commission, and your
                practitioner share.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl border border-[#83B7DE]/40 bg-[#83B7DE]/10 px-3.5 py-2 text-xs font-semibold text-[#114084]">
              <CheckCircle2 className="h-4 w-4" />
              80% Practitioner Share
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {/* PRACTITIONER EARNINGS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#3566AB]/10 text-[#3566AB] flex items-center justify-center">
                <Wallet className="h-5 w-5" />
              </div>

              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                Your Share
              </span>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C] mt-4">
              {formatCurrency(totals.practitioner)}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              80% of completed consultation revenue
            </p>
          </div>

          {/* GROSS REVENUE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#3566AB] flex items-center justify-center">
                <Banknote className="h-5 w-5" />
              </div>

              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                Gross
              </span>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C] mt-4">
              {formatCurrency(totals.gross)}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Total completed consultation fees
            </p>
          </div>

          {/* TELECARE COMMISSION */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>

              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                TeleCare
              </span>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C] mt-4">
              {formatCurrency(totals.commission)}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              20% platform commission
            </p>
          </div>

          {/* CONSULTATIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl bg-[#83B7DE]/20 text-[#3566AB] flex items-center justify-center">
                <CalendarDays className="h-5 w-5" />
              </div>

              <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                Completed
              </span>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C] mt-4">
              {earnings.length}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Completed consultations
            </p>
          </div>
        </section>

        {/* COMMISSION BREAKDOWN */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-[#1C1C1C]">
                Revenue Breakdown
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Every completed consultation follows the TeleCare 20/80 revenue
                split.
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>20% TeleCare</span>
              <span className="text-slate-300">•</span>
              <span>80% Practitioner</span>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="w-1/5 bg-[#83B7DE]" />
              <div className="w-4/5 bg-[#3566AB]" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#83B7DE]" />

                  <span className="text-xs font-semibold text-slate-500">
                    TeleCare Commission
                  </span>
                </div>

                <p className="text-lg font-bold text-[#1C1C1C] mt-1">
                  {formatCurrency(totals.commission)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#3566AB]" />

                  <span className="text-xs font-semibold text-slate-500">
                    Practitioner Earnings
                  </span>
                </div>

                <p className="text-lg font-bold text-[#1C1C1C] mt-1">
                  {formatCurrency(totals.practitioner)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* EARNINGS HISTORY */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#1C1C1C]">
                  Earnings History
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Completed consultations and their revenue distribution.
                </p>
              </div>

              <FileText className="h-5 w-5 text-[#3566AB]" />
            </div>
          </div>

          {earnings.length === 0 ? (
            <div className="py-14 px-6 text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Clock3 className="h-6 w-6" />
              </div>

              <h3 className="text-sm font-bold text-[#1C1C1C] mt-4">
                No completed consultations yet
              </h3>

              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Earnings will appear here after you complete patient
                consultations.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {earnings.map(
                ({
                  appointment,
                  patient,
                  gross,
                  commission,
                  practitionerShare,
                }) => (
                  <div
                    key={appointment.id}
                    className="p-5 hover:bg-slate-50/70 transition"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#3566AB]/10 text-[#3566AB] flex items-center justify-center shrink-0">
                          <CalendarDays className="h-4 w-4" />
                        </div>

                        <div>
                          <p className="text-sm font-bold text-[#1C1C1C]">
                            {patient?.name || "Patient"}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                            <span className="text-xs text-slate-500">
                              {formatDate(appointment.dateTime)}
                            </span>

                            <span className="text-slate-300">•</span>

                            <span className="text-xs text-slate-500">
                              {formatTime(appointment.dateTime)}
                            </span>

                            <span className="text-slate-300">•</span>

                            <span className="text-xs text-slate-500">
                              {appointment.reasonForVisit}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-5 text-right">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                            Gross
                          </p>

                          <p className="text-sm font-bold text-[#1C1C1C] mt-1">
                            {formatCurrency(gross)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                            TeleCare
                          </p>

                          <p className="text-sm font-bold text-slate-600 mt-1">
                            -{formatCurrency(commission)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">
                            Your Share
                          </p>

                          <p className="text-sm font-bold text-[#3566AB] mt-1">
                            {formatCurrency(practitionerShare)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* PAYOUT */}
        <section className="mt-6 bg-[#114084] rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />

                <h2 className="text-base font-bold">Practitioner Payouts</h2>
              </div>

              <p className="text-sm text-blue-100 mt-1 max-w-xl">
                Payout management will be available here once practitioner
                payment details and payout processing are configured.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/60 cursor-not-allowed"
            >
              Request Payout
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* PROTOTYPE NOTICE */}
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-[#83B7DE]/40 bg-[#83B7DE]/10">
          <FileText className="h-4 w-4 text-[#3566AB] shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-semibold text-[#114084]">
              Practitioner Earnings
            </p>

            <p className="text-[11px] text-[#3566AB] mt-1 leading-relaxed">
              Earnings are calculated from each appointment&apos;s stored
              consultation fee using the prototype&apos;s 20% TeleCare
              commission and 80% practitioner revenue split. Payment processing
              is simulated.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
