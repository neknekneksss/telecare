"use client";

import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  HeartPulse,
  MessageCircle,
  Pill,
  Search,
  Stethoscope,
  Thermometer,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useClinicalNotes } from "@/store/clinicalNotes";
import { usePrescriptions } from "@/store/prescriptions";

export default function DoctorPatientsPage() {
  const { userId } = useSession();
  const { patients } = useUsers();
  const { appointments } = useAppointments();
  const { clinicalNotes } = useClinicalNotes();
  const { prescriptions } = usePrescriptions();

  const [search, setSearch] = useState("");

  const doctorPatients = useMemo(() => {
    if (!userId) return [];

    const patientIds = Array.from(
      new Set(
        appointments
          .filter((appointment) => appointment.doctorId === userId)
          .map((appointment) => appointment.patientId),
      ),
    );

    return patients
      .filter((patient) => patientIds.includes(patient.id))
      .map((patient) => {
        const patientAppointments = appointments
          .filter(
            (appointment) =>
              appointment.doctorId === userId &&
              appointment.patientId === patient.id,
          )
          .sort(
            (a, b) =>
              new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
          );

        const latestAppointment = patientAppointments[0];

        const completedAppointments = patientAppointments.filter(
          (appointment) => appointment.status === "completed",
        );

        const latestCompleted = completedAppointments[0];

        const latestNote = latestCompleted
          ? clinicalNotes.find(
              (note) => note.appointmentId === latestCompleted.id,
            )
          : undefined;

        const latestPrescription = latestCompleted
          ? prescriptions.find(
              (prescription) =>
                prescription.appointmentId === latestCompleted.id,
            )
          : undefined;

        return {
          patient,
          patientAppointments,
          completedAppointments,
          latestAppointment,
          latestCompleted,
          latestNote,
          latestPrescription,
        };
      });
  }, [userId, patients, appointments, clinicalNotes, prescriptions]);

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return doctorPatients;

    return doctorPatients.filter(({ patient }) => {
      return (
        patient.name.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    });
  }, [doctorPatients, search]);

  const formatDate = (dateTime?: string) => {
    if (!dateTime) return "No consultation yet";

    return new Date(dateTime).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .replace(/^Dr\.\s*/i, "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#F1F1F1] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md w-full">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#3566AB]/10 text-[#3566AB] flex items-center justify-center">
            <UserRound className="h-7 w-7" />
          </div>

          <h1 className="text-xl font-bold text-[#1C1C1C] mt-4">
            Doctor session not found
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Please log in using a doctor account to view your patients.
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

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-sm font-medium text-[#3566AB]">
                Practitioner Portal
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1C1C] mt-1">
                My Patients
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Review patient history, clinical information, and health
                progress from your consultations.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <UserRound className="h-4 w-4 text-[#3566AB]" />
              {doctorPatients.length}{" "}
              {doctorPatients.length === 1 ? "patient" : "patients"}
            </div>
          </div>
        </div>

        {/* SEARCH */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patients by name or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-3 text-sm text-[#1C1C1C] outline-none transition focus:border-[#3566AB] focus:ring-2 focus:ring-[#3566AB]/10"
            />
          </div>
        </section>

        {/* PATIENT LIST */}
        {filteredPatients.length === 0 ? (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                {search ? (
                  <Search className="h-7 w-7" />
                ) : (
                  <UserRound className="h-7 w-7" />
                )}
              </div>

              <h2 className="text-lg font-bold text-[#1C1C1C] mt-4">
                {search ? "No patients found" : "No patients yet"}
              </h2>

              <p className="text-sm text-slate-500 max-w-md mx-auto mt-2">
                {search
                  ? "Try a different patient name or email address."
                  : "Patients will appear here once they have an appointment with you."}
              </p>
            </div>
          </section>
        ) : (
          <div className="space-y-4">
            {filteredPatients.map(
              ({
                patient,
                patientAppointments,
                completedAppointments,
                latestAppointment,
                latestCompleted,
                latestNote,
                latestPrescription,
              }) => (
                <article
                  key={patient.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:border-[#83B7DE] transition"
                >
                  {/* PATIENT HEADER */}
                  <div className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div
                          className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold shrink-0"
                          style={{
                            backgroundColor: patient.avatarColor || "#3566AB",
                          }}
                        >
                          {getInitials(patient.name)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-[#1C1C1C]">
                              {patient.name}
                            </h2>

                            {latestAppointment?.status === "upcoming" && (
                              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#3566AB]">
                                Upcoming
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-slate-500 mt-1">
                            {patient.email || "No email provided"}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <ClipboardList className="h-3.5 w-3.5 text-[#3566AB]" />
                              {patientAppointments.length}{" "}
                              {patientAppointments.length === 1
                                ? "appointment"
                                : "appointments"}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Stethoscope className="h-3.5 w-3.5 text-[#3566AB]" />
                              {completedAppointments.length}{" "}
                              {completedAppointments.length === 1
                                ? "consultation"
                                : "consultations"}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5 text-[#3566AB]" />
                              Last visit:{" "}
                              {formatDate(latestCompleted?.dateTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/doctor/messages?patient=${patient.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Link>

                        {latestCompleted ? (
                          <Link
                            href={`/doctor/appointments/${latestCompleted.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#114084] transition"
                          >
                            View Record
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        ) : latestAppointment ? (
                          <Link
                            href={`/doctor/appointments/${latestAppointment.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#114084] transition"
                          >
                            Open Appointment
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* VITALS */}
                  <div className="border-t border-slate-100 px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-[#3566AB]" />

                        <p className="text-sm font-bold text-[#1C1C1C]">
                          Latest Vitals
                        </p>
                      </div>

                      {latestCompleted && (
                        <span className="text-[11px] text-slate-400">
                          {formatDate(latestCompleted.dateTime)}
                        </span>
                      )}
                    </div>

                    {latestNote ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* BLOOD PRESSURE */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex items-center gap-2">
                            <HeartPulse className="h-4 w-4 text-[#3566AB]" />

                            <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                              Blood Pressure
                            </span>
                          </div>

                          <p className="text-xl font-bold text-[#1C1C1C] mt-2">
                            {latestNote.vitals.bloodPressure || "—"}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            mmHg
                          </p>
                        </div>

                        {/* HEART RATE */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-[#3566AB]" />

                            <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                              Heart Rate
                            </span>
                          </div>

                          <p className="text-xl font-bold text-[#1C1C1C] mt-2">
                            {latestNote.vitals.heartRate || "—"}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            bpm
                          </p>
                        </div>

                        {/* TEMPERATURE */}
                        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4 text-[#3566AB]" />

                            <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                              Temperature
                            </span>
                          </div>

                          <p className="text-xl font-bold text-[#1C1C1C] mt-2">
                            {latestNote.vitals.temperature || "—"}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-0.5">
                            °C
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-5 text-sm text-slate-500">
                        No clinical vitals have been recorded for this patient
                        yet.
                      </div>
                    )}
                  </div>

                  {/* CLINICAL SUMMARY */}
                  <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {/* DIAGNOSIS */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Stethoscope className="h-4 w-4 text-[#3566AB]" />

                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                            Latest Diagnosis
                          </p>
                        </div>

                        <p className="text-sm font-medium text-[#1C1C1C]">
                          {latestNote?.diagnosis || "No diagnosis recorded"}
                        </p>

                        {latestNote?.icd10Code && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            ICD-10: {latestNote.icd10Code}
                          </p>
                        )}
                      </div>

                      {/* CARE PLAN */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <ClipboardList className="h-4 w-4 text-[#3566AB]" />

                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                            Care Plan
                          </p>
                        </div>

                        <p className="text-sm font-medium text-[#1C1C1C]">
                          {latestNote?.treatmentPlan ||
                            "No treatment plan recorded"}
                        </p>
                      </div>

                      {/* DOCTOR'S NOTES */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText className="h-4 w-4 text-[#3566AB]" />

                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                            Doctor&apos;s Notes
                          </p>
                        </div>

                        <p className="text-sm font-medium text-[#1C1C1C]">
                          {latestNote?.doctorNotes?.trim() ||
                            "No doctor's notes recorded"}
                        </p>
                      </div>

                      {/* MEDICATION */}
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <Pill className="h-4 w-4 text-[#3566AB]" />

                          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
                            Medication
                          </p>
                        </div>

                        <p className="text-sm font-medium text-[#1C1C1C]">
                          {latestPrescription
                            ? `${latestPrescription.medication} · ${latestPrescription.dosage}`
                            : "No prescription recorded"}
                        </p>

                        {latestPrescription?.schedule && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            {latestPrescription.schedule}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ),
            )}
          </div>
        )}

        {/* PROTOTYPE NOTICE */}
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-[#83B7DE]/40 bg-[#83B7DE]/10">
          <FileText className="h-4 w-4 text-[#3566AB] shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-semibold text-[#114084]">
              Practitioner Patient Records
            </p>

            <p className="text-[11px] text-[#3566AB] mt-1 leading-relaxed">
              Patient information shown here is based on appointments,
              consultation notes, prescriptions, and recorded vitals stored in
              this presentation prototype.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
