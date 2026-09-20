"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Pill,
  RefreshCw,
  ShieldCheck,
  CircleAlert,
  type LucideIcon,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { usePrescriptions } from "@/store/prescriptions";
import { useMedicationLogs } from "@/store/medicationLogs";
import {
  generateDosesForDate,
  generateTodayDoses,
  formatDoseTime,
  isDosePast,
  type MedicationDose,
} from "@/lib/medicationSchedule";

function formatDate(date: Date) {
  return date.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isSameDay(dateA: string, dateB: Date) {
  return new Date(dateA).toDateString() === dateB.toDateString();
}

function getDoseStatus(
  scheduledFor: string,
  taken: boolean,
): "taken" | "missed" | "upcoming" {
  if (taken) {
    return "taken";
  }

  if (isDosePast(scheduledFor)) {
    return "missed";
  }

  return "upcoming";
}

export default function PatientMedicationsPage() {
  const { userId } = useSession();
  const { patients } = useUsers();

  const { prescriptions, loadPrescriptions } = usePrescriptions();
  const { medicationLogs, loadMedicationLogs, logDose } = useMedicationLogs();

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  useEffect(() => {
    loadMedicationLogs();
  }, [loadMedicationLogs]);

  const patient = patients.find((item) => item.id === userId);

  const myPrescriptions = useMemo(
    () =>
      prescriptions.filter((prescription) => prescription.patientId === userId),
    [prescriptions, userId],
  );

  const today = new Date();

  const tomorrow = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 1);
    return date;
  }, [today.toDateString()]);

  const todayDoses = useMemo(
    () => generateTodayDoses(myPrescriptions, today),
    [myPrescriptions, medicationLogs],
  );

  const tomorrowDoses = useMemo(
    () =>
      myPrescriptions.flatMap((prescription) =>
        generateDosesForDate(prescription, tomorrow),
      ),
    [myPrescriptions, medicationLogs, tomorrow],
  );

  const takenToday = useMemo(
    () =>
      todayDoses.filter((dose) =>
        medicationLogs.some(
          (log) =>
            log.prescriptionId === dose.prescriptionId &&
            log.scheduledFor === dose.scheduledFor &&
            Boolean(log.takenAt),
        ),
      ).length,
    [todayDoses, medicationLogs],
  );

  const totalToday = todayDoses.length;
  const remainingToday = Math.max(totalToday - takenToday, 0);

  const nextDose = useMemo(() => {
    const now = Date.now();

    const upcomingToday = todayDoses
      .filter((dose) => {
        const alreadyTaken = medicationLogs.some(
          (log) =>
            log.prescriptionId === dose.prescriptionId &&
            log.scheduledFor === dose.scheduledFor &&
            Boolean(log.takenAt),
        );

        return !alreadyTaken && new Date(dose.scheduledFor).getTime() >= now;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      );

    if (upcomingToday.length > 0) {
      return upcomingToday[0];
    }

    const upcomingTomorrow = tomorrowDoses
      .filter((dose) => {
        const alreadyTaken = medicationLogs.some(
          (log) =>
            log.prescriptionId === dose.prescriptionId &&
            log.scheduledFor === dose.scheduledFor &&
            Boolean(log.takenAt),
        );

        return !alreadyTaken;
      })
      .sort(
        (a, b) =>
          new Date(a.scheduledFor).getTime() -
          new Date(b.scheduledFor).getTime(),
      );

    return upcomingTomorrow[0];
  }, [todayDoses, tomorrowDoses, medicationLogs]);

  const nextMedication = useMemo(() => {
    if (!nextDose) {
      return undefined;
    }

    return myPrescriptions.find(
      (prescription) => prescription.id === nextDose.prescriptionId,
    );
  }, [nextDose, myPrescriptions]);

  const dosesByPrescription = useMemo(() => {
    const map = new Map<string, MedicationDose[]>();

    todayDoses.forEach((dose) => {
      const existing = map.get(dose.prescriptionId) ?? [];
      map.set(dose.prescriptionId, [...existing, dose]);
    });

    return map;
  }, [todayDoses]);

  if (!userId || !patient) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F1F1F1] p-6">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#3566AB]/10 text-[#3566AB]">
            <Pill size={25} />
          </div>

          <h1 className="text-xl font-bold text-[#1C1C1C]">
            Patient session not found
          </h1>

          <p className="mt-2 text-sm text-[#808080]">
            Please log in using a patient account to view your medications.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#3566AB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#114084]"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page-enter min-h-screen bg-[#F1F1F1]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="fade-up">
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#808080] transition hover:text-[#3566AB]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#3566AB]">
                Patient Portal
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1C1C1C] sm:text-3xl">
                My Medications
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[#808080] sm:text-base">
                Keep track of your prescribed medicines, scheduled doses, and
                refill reminders.
              </p>
            </div>

            <Link
              href="/patient/records"
              className="telecare-button inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:border-[#83B7DE] hover:text-[#3566AB]"
            >
              <FileText size={16} />
              Medical Records
            </Link>
          </div>
        </section>

        <section className="mt-7 grid grid-cols-1 gap-3 fade-up fade-up-delay-1 sm:grid-cols-3">
          <SummaryCard
            icon={Pill}
            label="Active medications"
            value={String(myPrescriptions.length)}
            iconClass="bg-blue-50 text-[#3566AB]"
          />

          <SummaryCard
            icon={CheckCircle2}
            label="Taken today"
            value={`${takenToday}${totalToday > 0 ? ` / ${totalToday}` : ""}`}
            iconClass="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            icon={Clock3}
            label="Remaining today"
            value={String(remainingToday)}
            iconClass="bg-amber-50 text-amber-600"
          />
        </section>

        {nextDose && nextMedication && (
          <section className="mt-5 overflow-hidden rounded-2xl border border-[#83B7DE]/50 bg-white shadow-sm fade-up fade-up-delay-2">
            <div className="bg-gradient-to-br from-[#114084] to-[#3566AB] p-5 text-white sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <Pill size={23} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-100">
                      Next dose
                    </p>

                    <h2 className="mt-1 truncate text-lg font-bold sm:text-xl">
                      {nextMedication.medication}
                    </h2>

                    <p className="mt-1 text-sm text-blue-100">
                      {nextMedication.dosage}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-xs text-blue-100">
                    <Clock3 size={14} />

                    {isSameDay(nextDose.scheduledFor, today)
                      ? "Today"
                      : "Tomorrow"}
                  </div>

                  <p className="mt-1 text-sm font-bold">
                    {formatDoseTime(nextDose.scheduledFor)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <p className="text-sm text-[#808080]">
                Follow the schedule provided by your practitioner.
              </p>

              <button
                type="button"
                onClick={() => {
                  void logDose(nextDose.prescriptionId, nextDose.scheduledFor);
                }}
                className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#114084]"
              >
                <Check size={16} />
                Mark as Taken
              </button>
            </div>
          </section>
        )}

        {!nextDose && totalToday > 0 && (
          <section className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
              <CheckCircle2 size={19} />
            </div>

            <div>
              <p className="text-sm font-bold text-emerald-800">
                All scheduled doses are recorded
              </p>

              <p className="mt-0.5 text-xs text-emerald-700">
                Your next scheduled dose will appear here when available.
              </p>
            </div>
          </section>
        )}

        <section className="mt-7 fade-up fade-up-delay-2">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-[#1C1C1C]">
              Today&apos;s medications
            </h2>

            <p className="mt-0.5 text-sm text-[#808080]">{formatDate(today)}</p>
          </div>

          {myPrescriptions.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F1F1] text-[#808080]">
                <Pill size={24} />
              </div>

              <h3 className="mt-4 text-base font-bold text-[#1C1C1C]">
                No active medications
              </h3>

              <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#808080]">
                Prescriptions from your completed consultations will appear here
                automatically.
              </p>

              <Link
                href="/patient/records"
                className="telecare-button mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-[#1C1C1C] hover:border-[#83B7DE] hover:text-[#3566AB]"
              >
                View Medical Records
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {myPrescriptions.map((prescription) => {
                const doses = dosesByPrescription.get(prescription.id) ?? [];

                if (doses.length === 0) {
                  return (
                    <MedicationCard
                      key={prescription.id}
                      medication={prescription.medication}
                      dosage={prescription.dosage}
                      schedule={prescription.schedule}
                      refillReminder={prescription.refillRemindAt}
                      doses={[]}
                      onTake={() => undefined}
                    />
                  );
                }

                return (
                  <MedicationCard
                    key={prescription.id}
                    medication={prescription.medication}
                    dosage={prescription.dosage}
                    schedule={prescription.schedule}
                    refillReminder={prescription.refillRemindAt}
                    doses={doses}
                    medicationLogs={medicationLogs}
                    onTake={(scheduledFor) => {
                      void logDose(prescription.id, scheduledFor);
                    }}
                  />
                );
              })}
            </div>
          )}
        </section>

        {myPrescriptions.some(
          (prescription) => prescription.refillRemindAt,
        ) && (
          <section className="mt-7 fade-up fade-up-delay-3">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-[#1C1C1C]">
                Refill reminders
              </h2>

              <p className="mt-0.5 text-sm text-[#808080]">
                Keep your prescriptions from running out unexpectedly.
              </p>
            </div>

            <div className="space-y-3">
              {myPrescriptions
                .filter((prescription) => prescription.refillRemindAt)
                .map((prescription) => (
                  <div
                    key={prescription.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#83B7DE]/50 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                        <RefreshCw size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#1C1C1C]">
                          {prescription.medication}
                        </p>

                        <p className="mt-0.5 text-xs text-[#808080]">
                          {prescription.dosage}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold text-[#3566AB]">
                      <CalendarClock size={15} />

                      <span>
                        Refill reminder:{" "}
                        <span className="font-semibold text-[#1C1C1C]">
                          {prescription.refillRemindAt}
                        </span>
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#83B7DE]/40 bg-[#83B7DE]/10 p-4">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-[#3566AB]" />

          <div>
            <p className="text-xs font-semibold text-[#114084]">
              Medication tracking
            </p>

            <p className="mt-1 text-[11px] leading-relaxed text-[#3566AB]">
              This tracker records your medication activity for your TeleCare
              account. Always follow the medication instructions provided by
              your healthcare practitioner.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  iconClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  iconClass: string;
}) {
  return (
    <div className="telecare-card flex items-center gap-4 p-4 sm:p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-[#808080]">{label}</p>

        <p className="mt-0.5 text-xl font-bold text-[#1C1C1C]">{value}</p>
      </div>
    </div>
  );
}

function MedicationCard({
  medication,
  dosage,
  schedule,
  refillReminder,
  doses,
  medicationLogs = [],
  onTake,
}: {
  medication: string;
  dosage: string;
  schedule: string;
  refillReminder?: string;
  doses: MedicationDose[];
  medicationLogs?: {
    id: string;
    prescriptionId: string;
    scheduledFor: string;
    takenAt?: string;
  }[];
  onTake: (scheduledFor: string) => void;
}) {
  const takenCount = doses.filter((dose) =>
    medicationLogs.some(
      (log) =>
        log.prescriptionId === dose.prescriptionId &&
        log.scheduledFor === dose.scheduledFor &&
        Boolean(log.takenAt),
    ),
  ).length;

  const status =
    doses.length === 0
      ? "as-needed"
      : takenCount === doses.length
        ? "taken"
        : doses.some(
              (dose) =>
                getDoseStatus(
                  dose.scheduledFor,
                  medicationLogs.some(
                    (log) =>
                      log.prescriptionId === dose.prescriptionId &&
                      log.scheduledFor === dose.scheduledFor &&
                      Boolean(log.takenAt),
                  ),
                ) === "missed",
            )
          ? "missed"
          : "upcoming";

  const statusConfig = {
    taken: {
      label: "All doses recorded",
      className: "bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },
    missed: {
      label: "Dose overdue",
      className: "bg-amber-50 text-amber-700",
      icon: CircleAlert,
    },
    upcoming: {
      label: "Upcoming",
      className: "bg-blue-50 text-[#3566AB]",
      icon: Clock3,
    },
    "as-needed": {
      label: "As needed",
      className: "bg-slate-100 text-slate-600",
      icon: Pill,
    },
  } as const;

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <article className="telecare-card-hover overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#83B7DE]/15 text-[#3566AB]">
              <Pill size={20} />
            </div>

            <div className="min-w-0">
              <h3 className="break-words text-base font-bold text-[#1C1C1C]">
                {medication}
              </h3>

              <p className="mt-1 text-sm font-medium text-[#3566AB]">
                {dosage}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${config.className}`}
          >
            <StatusIcon size={12} />
            {config.label}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F1F1F1] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">
              Schedule
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1C1C1C]">
              {schedule || "Not specified"}
            </p>
          </div>

          <div className="rounded-xl bg-[#F1F1F1] p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">
              Today
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1C1C1C]">
              {doses.length > 0
                ? `${takenCount} / ${doses.length} doses recorded`
                : "No fixed doses"}
            </p>
          </div>
        </div>

        {doses.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#808080]">
              Scheduled doses
            </p>

            {doses.map((dose) => {
              const taken = medicationLogs.some(
                (log) =>
                  log.prescriptionId === dose.prescriptionId &&
                  log.scheduledFor === dose.scheduledFor &&
                  Boolean(log.takenAt),
              );

              const doseStatus = getDoseStatus(dose.scheduledFor, taken);

              return (
                <div
                  key={dose.scheduledFor}
                  className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        doseStatus === "taken"
                          ? "bg-emerald-50 text-emerald-600"
                          : doseStatus === "missed"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-blue-50 text-[#3566AB]"
                      }`}
                    >
                      {doseStatus === "taken" ? (
                        <CheckCircle2 size={17} />
                      ) : doseStatus === "missed" ? (
                        <CircleAlert size={17} />
                      ) : (
                        <Clock3 size={17} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#1C1C1C]">
                        {dose.label}
                      </p>

                      <p className="mt-0.5 text-[11px] text-[#808080]">
                        {doseStatus === "taken"
                          ? "Dose recorded"
                          : doseStatus === "missed"
                            ? "Dose may be overdue"
                            : "Upcoming dose"}
                      </p>
                    </div>
                  </div>

                  {doseStatus !== "taken" && (
                    <button
                      type="button"
                      onClick={() => onTake(dose.scheduledFor)}
                      className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#114084]"
                    >
                      <Check size={14} />
                      Mark as Taken
                    </button>
                  )}

                  {doseStatus === "taken" && (
                    <div className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700">
                      <Check size={14} />
                      Recorded
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {refillReminder && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[#808080]">
            <RefreshCw size={14} className="shrink-0 text-[#3566AB]" />

            <span>
              Refill reminder:{" "}
              <span className="font-semibold text-[#1C1C1C]">
                {refillReminder}
              </span>
            </span>
          </div>
        )}

        {doses.length === 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3.5">
            <p className="text-xs leading-relaxed text-slate-600">
              This medication does not have a fixed automatic dose schedule.
              Follow your practitioner&apos;s instructions when taking it.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
