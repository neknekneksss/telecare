"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  FileText,
  HeartPulse,
  Pill,
  Star,
  Stethoscope,
  Thermometer,
  UserRound,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useClinicalNotes } from "@/store/clinicalNotes";
import { usePrescriptions } from "@/store/prescriptions";
import { useRatings } from "@/store/ratings";

export default function PatientRecordsPage() {
  const { userId } = useSession();
  const { patients, doctors } = useUsers();

  const { appointments, loadAppointments } = useAppointments();
  const { clinicalNotes, loadClinicalNotes } = useClinicalNotes();
  const { prescriptions, loadPrescriptions } = usePrescriptions();

  const ratings = useRatings((state) => state.ratings);
  const addRating = useRatings((state) => state.addRating);

  const [ratingValues, setRatingValues] = useState<Record<string, number>>({});
  const [feedbackValues, setFeedbackValues] = useState<Record<string, string>>(
    {},
  );
  const [submittingRating, setSubmittingRating] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      loadAppointments(),
      loadClinicalNotes(),
      loadPrescriptions(),
    ]);
  }, [loadAppointments, loadClinicalNotes, loadPrescriptions]);

  const currentPatient = patients.find((patient) => patient.id === userId);

  const patientAppointments = appointments
    .filter((appointment) => appointment.patientId === userId)
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );

  const completedAppointments = patientAppointments.filter(
    (appointment) => appointment.status === "completed",
  );

  const getDoctor = (doctorId: string) => {
    return doctors.find((doctor) => doctor.id === doctorId);
  };

  const getClinicalNote = (appointmentId: string) => {
    return clinicalNotes.find((note) => note.appointmentId === appointmentId);
  };

  const getPrescription = (appointmentId: string) => {
    return prescriptions.find(
      (prescription) => prescription.appointmentId === appointmentId,
    );
  };

  const getRating = (appointmentId: string) => {
    return ratings.find(
      (rating) =>
        rating.appointmentId === appointmentId && rating.patientId === userId,
    );
  };

  const formatShortDate = (dateTime: string) => {
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
      .map((part) => part[0])
      .slice(0, 2)
      .join("");
  };

  async function handleSubmitRating(appointmentId: string, doctorId: string) {
    const rating = ratingValues[appointmentId] || 0;

    if (!userId || !rating || submittingRating === appointmentId) {
      return;
    }

    setSubmittingRating(appointmentId);

    try {
      await addRating({
        appointmentId,
        patientId: userId,
        doctorId,
        rating,
        feedback: feedbackValues[appointmentId]?.trim() || "",
      });

      setRatingValues((current) => {
        const next = { ...current };
        delete next[appointmentId];
        return next;
      });

      setFeedbackValues((current) => {
        const next = { ...current };
        delete next[appointmentId];
        return next;
      });
    } finally {
      setSubmittingRating(null);
    }
  }

  if (!userId || !currentPatient) {
    return (
      <main className="min-h-screen bg-[#F1F1F1] flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#3566AB]/10 text-[#3566AB] flex items-center justify-center">
            <FileText size={25} />
          </div>

          <h1 className="text-xl font-bold text-[#1C1C1C]">
            Patient session not found
          </h1>

          <p className="text-sm text-[#808080] mt-2">
            Please log in using a patient account to view your medical records.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-xl bg-[#3566AB] text-white text-sm font-semibold hover:bg-[#114084] transition"
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
        <div className="mb-8">
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center gap-2 text-sm text-[#808080] hover:text-[#3566AB] transition mb-5"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#3566AB]">
                Patient Portal
              </p>

              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1C1C] mt-1">
                Medical Records
              </h1>

              <p className="text-sm text-[#808080] mt-1">
                View your consultation history, clinical notes, prescriptions,
                and practitioner feedback.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#808080]">
              <FileText size={17} className="text-[#3566AB]" />

              <span>
                {completedAppointments.length} completed{" "}
                {completedAppointments.length === 1
                  ? "consultation"
                  : "consultations"}
              </span>
            </div>
          </div>
        </div>

        <section className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0"
              style={{
                backgroundColor: currentPatient.avatarColor || "#3566AB",
              }}
            >
              {getInitials(currentPatient.name)}
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                Patient
              </p>

              <h2 className="text-lg font-bold text-[#1C1C1C]">
                {currentPatient.name}
              </h2>

              <p className="text-xs text-[#808080] mt-0.5">
                {currentPatient.email}
              </p>
            </div>
          </div>
        </section>

        {completedAppointments.length === 0 ? (
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm">
            <div className="py-16 px-6 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F1F1F1] text-[#808080] flex items-center justify-center mb-4">
                <ClipboardList size={25} />
              </div>

              <h2 className="text-lg font-bold text-[#1C1C1C]">
                No completed consultations yet
              </h2>

              <p className="text-sm text-[#808080] max-w-md mx-auto mt-2 leading-relaxed">
                Your medical records will appear here after a practitioner
                completes your consultation and saves the clinical findings.
              </p>

              <Link
                href="/patient/book"
                className="inline-flex items-center justify-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-[#3566AB] text-white text-sm font-semibold hover:bg-[#114084] transition"
              >
                <CalendarDays size={16} />
                Book a Consultation
              </Link>
            </div>
          </section>
        ) : (
          <div className="space-y-5">
            {completedAppointments.map((appointment) => {
              const doctor = getDoctor(appointment.doctorId);
              const note = getClinicalNote(appointment.id);
              const prescription = getPrescription(appointment.id);
              const existingRating = getRating(appointment.id);
              const selectedRating = ratingValues[appointment.id] || 0;
              const isSubmitting = submittingRating === appointment.id;

              return (
                <section
                  key={appointment.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-5 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                          style={{
                            backgroundColor: doctor?.avatarColor || "#3566AB",
                          }}
                        >
                          {doctor ? getInitials(doctor.name) : "DR"}
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                            Consultation
                          </p>

                          <h2 className="text-base font-bold text-[#1C1C1C] mt-0.5">
                            {doctor?.name || "Practitioner"}
                          </h2>

                          <p className="text-xs text-[#3566AB] mt-0.5">
                            {doctor?.specialty || "Medical Consultation"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5 text-xs text-[#808080]">
                          <CalendarDays size={14} className="text-[#3566AB]" />

                          {formatShortDate(appointment.dateTime)}
                        </div>

                        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                          Completed
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                        Reason for Visit
                      </p>

                      <p className="text-sm text-[#1C1C1C] mt-1">
                        {appointment.reasonForVisit || "General consultation"}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    {!note && !prescription ? (
                      <div className="rounded-xl bg-[#F1F1F1] p-4">
                        <div className="flex items-start gap-3">
                          <FileText
                            size={18}
                            className="text-[#808080] shrink-0 mt-0.5"
                          />

                          <div>
                            <p className="text-sm font-semibold text-[#1C1C1C]">
                              Clinical record pending
                            </p>

                            <p className="text-xs text-[#808080] mt-1">
                              This consultation was marked as completed, but no
                              clinical notes or prescription have been recorded
                              yet.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {note && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <HeartPulse
                                size={17}
                                className="text-[#3566AB]"
                              />

                              <h3 className="text-sm font-bold text-[#1C1C1C]">
                                Clinical Findings
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-xl bg-[#F1F1F1] p-4">
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                  Blood Pressure
                                </p>

                                <p className="text-base font-bold text-[#1C1C1C] mt-2">
                                  {note.vitals.bloodPressure || "Not recorded"}
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#F1F1F1] p-4">
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                  Heart Rate
                                </p>

                                <p className="text-base font-bold text-[#1C1C1C] mt-2">
                                  {note.vitals.heartRate
                                    ? `${note.vitals.heartRate} bpm`
                                    : "Not recorded"}
                                </p>
                              </div>

                              <div className="rounded-xl bg-[#F1F1F1] p-4">
                                <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                  Temperature
                                </p>

                                <div className="flex items-center gap-2 mt-2">
                                  <Thermometer
                                    size={16}
                                    className="text-[#3566AB]"
                                  />

                                  <p className="text-base font-bold text-[#1C1C1C]">
                                    {note.vitals.temperature
                                      ? `${note.vitals.temperature} °C`
                                      : "Not recorded"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {note?.diagnosis && (
                          <div>
                            <h3 className="text-sm font-bold text-[#1C1C1C] mb-2">
                              Diagnosis
                            </h3>

                            <div className="rounded-xl border border-gray-200 p-4">
                              <p className="text-sm text-[#1C1C1C] leading-relaxed whitespace-pre-wrap">
                                {note.diagnosis}
                              </p>
                            </div>
                          </div>
                        )}

                        {note?.treatmentPlan && (
                          <div>
                            <h3 className="text-sm font-bold text-[#1C1C1C] mb-2">
                              Treatment Plan
                            </h3>

                            <div className="rounded-xl border border-gray-200 p-4">
                              <p className="text-sm text-[#1C1C1C] leading-relaxed whitespace-pre-wrap">
                                {note.treatmentPlan}
                              </p>
                            </div>
                          </div>
                        )}

                        {note?.doctorNotes?.trim() && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <UserRound size={17} className="text-[#3566AB]" />

                              <h3 className="text-sm font-bold text-[#1C1C1C]">
                                Doctor&apos;s Notes
                              </h3>
                            </div>

                            <div className="rounded-xl border border-[#83B7DE]/50 bg-[#83B7DE]/10 p-4">
                              <p className="text-sm text-[#1C1C1C] leading-relaxed whitespace-pre-wrap">
                                {note.doctorNotes}
                              </p>
                            </div>
                          </div>
                        )}

                        {prescription && (
                          <div>
                            <div className="flex items-center gap-2 mb-4">
                              <Pill size={17} className="text-[#3566AB]" />

                              <h3 className="text-sm font-bold text-[#1C1C1C]">
                                Prescription
                              </h3>
                            </div>

                            <div className="border border-[#83B7DE]/50 rounded-xl overflow-hidden">
                              <div className="p-4 bg-[#83B7DE]/10">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-base font-bold text-[#1C1C1C]">
                                      {prescription.medication}
                                    </p>

                                    <p className="text-sm text-[#3566AB] font-medium mt-1">
                                      {prescription.dosage}
                                    </p>
                                  </div>

                                  <div className="w-10 h-10 rounded-xl bg-white text-[#3566AB] flex items-center justify-center shrink-0">
                                    <Pill size={19} />
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-200">
                                <div className="p-4">
                                  <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                    Schedule
                                  </p>

                                  <p className="text-sm font-semibold text-[#1C1C1C] mt-1">
                                    {prescription.schedule || "Not specified"}
                                  </p>
                                </div>

                                <div className="p-4">
                                  <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                    Next Dose
                                  </p>

                                  <p className="text-sm font-semibold text-[#1C1C1C] mt-1">
                                    {prescription.nextDose || "Not specified"}
                                  </p>
                                </div>

                                <div className="p-4">
                                  <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                    Refill Reminder
                                  </p>

                                  <p className="text-sm font-semibold text-[#1C1C1C] mt-1">
                                    {prescription.refillRemindAt || "None"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Practitioner Rating */}
                    <div className="border-t border-gray-200 pt-6">
                      {existingRating ? (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-wide font-semibold text-[#808080]">
                                Your Feedback
                              </p>

                              <h3 className="text-sm font-bold text-[#1C1C1C] mt-1">
                                You rated this practitioner
                              </h3>
                            </div>

                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={19}
                                  fill={
                                    star <= existingRating.rating
                                      ? "currentColor"
                                      : "none"
                                  }
                                  className={
                                    star <= existingRating.rating
                                      ? "text-amber-500"
                                      : "text-gray-300"
                                  }
                                />
                              ))}

                              <span className="ml-2 text-sm font-bold text-[#1C1C1C]">
                                {existingRating.rating}/5
                              </span>
                            </div>
                          </div>

                          {existingRating.feedback?.trim() && (
                            <div className="mt-4 rounded-lg bg-white border border-amber-100 p-3">
                              <p className="text-sm text-[#1C1C1C] leading-relaxed">
                                &quot;{existingRating.feedback}&quot;
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[#83B7DE]/50 bg-[#83B7DE]/10 p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white text-[#3566AB] flex items-center justify-center shrink-0">
                              <Star size={19} />
                            </div>

                            <div className="flex-1">
                              <p className="text-[10px] uppercase tracking-wide font-semibold text-[#3566AB]">
                                Practitioner Feedback
                              </p>

                              <h3 className="text-sm font-bold text-[#1C1C1C] mt-1">
                                How was your consultation?
                              </h3>

                              <p className="text-xs text-[#808080] mt-1">
                                Rate your experience with{" "}
                                {doctor?.name || "your practitioner"}.
                              </p>

                              <div className="mt-4 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  const selected = star <= selectedRating;

                                  return (
                                    <button
                                      key={star}
                                      type="button"
                                      aria-label={`Rate ${star} out of 5`}
                                      onClick={() =>
                                        setRatingValues((current) => ({
                                          ...current,
                                          [appointment.id]: star,
                                        }))
                                      }
                                      className="rounded-md p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#3566AB]/30"
                                    >
                                      <Star
                                        size={27}
                                        fill={
                                          selected ? "currentColor" : "none"
                                        }
                                        className={
                                          selected
                                            ? "text-amber-500"
                                            : "text-gray-300 hover:text-amber-400"
                                        }
                                      />
                                    </button>
                                  );
                                })}

                                {selectedRating > 0 && (
                                  <span className="ml-2 text-xs font-semibold text-[#3566AB]">
                                    {selectedRating}/5
                                  </span>
                                )}
                              </div>

                              <textarea
                                value={feedbackValues[appointment.id] || ""}
                                onChange={(event) =>
                                  setFeedbackValues((current) => ({
                                    ...current,
                                    [appointment.id]: event.target.value,
                                  }))
                                }
                                placeholder="Optional feedback about your consultation..."
                                rows={3}
                                className="mt-4 w-full resize-none rounded-xl border border-white bg-white px-4 py-3 text-sm text-[#1C1C1C] outline-none focus:border-[#3566AB]"
                              />

                              <button
                                type="button"
                                disabled={!selectedRating || isSubmitting}
                                onClick={() =>
                                  handleSubmitRating(
                                    appointment.id,
                                    appointment.doctorId,
                                  )
                                }
                                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#114084] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {isSubmitting ? (
                                  <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    Submitting...
                                  </>
                                ) : (
                                  <>
                                    <Check size={16} />
                                    Submit Rating
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-[#83B7DE]/40 bg-[#83B7DE]/10">
          <Stethoscope size={17} className="text-[#3566AB] shrink-0 mt-0.5" />

          <div>
            <p className="text-xs font-semibold text-[#114084]">
              TeleCare Patient Records
            </p>

            <p className="text-[11px] text-[#3566AB] mt-1 leading-relaxed">
              Clinical notes, prescriptions, and practitioner feedback displayed
              here are synchronized with your TeleCare consultation records.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
