"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react";

import { useAppointments } from "@/store/appointments";
import { useClinicalNotes } from "@/store/clinicalNotes";
import { usePrescriptions } from "@/store/prescriptions";
import { useUsers } from "@/store/users";

export default function PatientConsultationPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  const { appointments } = useAppointments();
  const { clinicalNotes } = useClinicalNotes();
  const { prescriptions } = usePrescriptions();
  const { doctors } = useUsers();

  const appointment = useMemo(
    () => appointments.find((a) => a.id === appointmentId),
    [appointments, appointmentId],
  );

  const doctor = useMemo(
    () =>
      appointment
        ? doctors.find((doctor) => doctor.id === appointment.doctorId)
        : undefined,
    [doctors, appointment],
  );

  const clinicalNote = useMemo(
    () => clinicalNotes.find((note) => note.appointmentId === appointmentId),
    [clinicalNotes, appointmentId],
  );

  const prescription = useMemo(
    () =>
      prescriptions.find(
        (prescription) => prescription.appointmentId === appointmentId,
      ),
    [prescriptions, appointmentId],
  );

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/patient/appointments"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to appointments
          </Link>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <FileText className="mx-auto mb-4 h-10 w-10 text-slate-400" />

            <h1 className="text-xl font-semibold text-slate-900">
              Consultation not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              We couldn&apos;t find this consultation.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const date = new Date(appointment.dateTime);

  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const isCompleted = appointment.status === "completed";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/patient/appointments"
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to appointments
        </Link>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-6 py-7 text-white sm:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm text-blue-100">
                  <Stethoscope className="h-4 w-4" />
                  Consultation Summary
                </div>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  {doctor?.name ?? "Your Doctor"}
                </h1>

                <p className="mt-1 text-sm text-blue-100">
                  {doctor?.specialty ?? "Healthcare Practitioner"}
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                {isCompleted ? "Completed" : "Upcoming"}
              </div>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 px-6 py-5 sm:grid-cols-2 sm:px-8 lg:grid-cols-3">
            <InfoItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Date"
              value={formattedDate}
            />

            <InfoItem
              icon={<Clock3 className="h-4 w-4" />}
              label="Time"
              value={formattedTime}
            />

            <InfoItem
              icon={<ClipboardList className="h-4 w-4" />}
              label="Reason"
              value={appointment.reasonForVisit || "General consultation"}
            />
          </div>
        </section>

        {!isCompleted ? (
          <section className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex gap-4">
              <Clock3 className="mt-0.5 h-6 w-6 shrink-0 text-blue-600" />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Consultation not completed yet
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Your consultation results, clinical notes, and prescriptions
                  will appear here after your doctor completes the consultation.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Clinical Summary */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <SectionHeader
                icon={<FileText className="h-5 w-5" />}
                title="Clinical Summary"
                description="Information recorded by your doctor during the consultation."
              />

              {clinicalNote ? (
                <div className="mt-6 space-y-5">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Diagnosis
                    </p>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-sm font-medium text-slate-900">
                        {clinicalNote.diagnosis || "No diagnosis recorded."}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Treatment Plan
                    </p>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {clinicalNote.treatmentPlan ||
                          "No treatment plan recorded."}
                      </p>
                    </div>
                  </div>

                  {clinicalNote.doctorNotes && (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Doctor&apos;s Notes
                      </p>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {clinicalNote.doctorNotes}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState text="No clinical notes were recorded for this consultation." />
              )}
            </section>

            {/* Vitals */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <SectionHeader
                icon={<HeartPulse className="h-5 w-5" />}
                title="Vitals"
                description="Vitals recorded during your consultation."
              />

              {clinicalNote ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <VitalCard
                    label="Blood Pressure"
                    value={clinicalNote.vitals?.bloodPressure || "Not recorded"}
                  />

                  <VitalCard
                    label="Heart Rate"
                    value={
                      clinicalNote.vitals?.heartRate
                        ? `${clinicalNote.vitals.heartRate} bpm`
                        : "Not recorded"
                    }
                  />

                  <VitalCard
                    label="Temperature"
                    value={
                      clinicalNote.vitals?.temperature
                        ? `${clinicalNote.vitals.temperature} °C`
                        : "Not recorded"
                    }
                  />
                </div>
              ) : (
                <EmptyState text="No vitals were recorded." />
              )}
            </section>

            {/* Prescription */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <SectionHeader
                icon={<Pill className="h-5 w-5" />}
                title="Prescription"
                description="Medication instructions provided by your doctor."
              />

              {prescription ? (
                <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/50 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                        Medication
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-slate-900">
                        {prescription.medication}
                      </h3>
                    </div>

                    <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                      Active prescription
                    </span>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <PrescriptionItem
                      label="Dosage"
                      value={prescription.dosage}
                    />

                    <PrescriptionItem
                      label="Schedule"
                      value={prescription.schedule}
                    />

                    <PrescriptionItem
                      label="Next Dose"
                      value={prescription.nextDose}
                    />
                  </div>

                  {prescription.refillRemindAt && (
                    <div className="mt-4 border-t border-blue-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Refill Reminder
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {prescription.refillRemindAt}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState text="No prescription was issued for this consultation." />
              )}
            </section>

            {/* Actions */}
            <section className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/patient/appointments"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <CalendarDays className="h-4 w-4" />
                View Appointments
              </Link>

              <Link
                href="/patient/medications"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Pill className="h-4 w-4" />
                Medication Tracker
              </Link>

              <Link
                href="/patient/records"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
                Health Records
              </Link>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>

        <p className="mt-0.5 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function VitalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function PrescriptionItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800">
        {value || "Not specified"}
      </p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
      {text}
    </div>
  );
}
