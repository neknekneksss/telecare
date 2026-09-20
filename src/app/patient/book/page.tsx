"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Pill,
  Stethoscope,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useReminders } from "@/store/reminders";
import { useFollowUps } from "@/store/followUps";
import { Doctor, TriageIntake } from "@/lib/types";

type Step = 1 | 2 | 3 | 4 | 5;

const DEFAULT_CONSULTATION_FEE = 800;

const urgencyOptions = [
  {
    value: "low" as const,
    label: "Mild",
    description: "Symptoms are manageable and not urgent.",
  },
  {
    value: "medium" as const,
    label: "Moderate",
    description: "Symptoms are affecting my normal activities.",
  },
  {
    value: "high" as const,
    label: "Severe",
    description: "Symptoms are significantly affecting me.",
  },
];

const symptomOptions = [
  "Fever",
  "Cough",
  "Headache",
  "Sore throat",
  "Shortness of breath",
  "Chest pain",
  "Abdominal pain",
  "Nausea or vomiting",
  "Diarrhea",
  "Dizziness",
  "Fatigue",
  "Body pain",
];

const durationOptions = [
  "Today",
  "1–3 days",
  "4–7 days",
  "1–2 weeks",
  "More than 2 weeks",
  "Ongoing / recurring",
];

function generateFallbackSlots(): string[] {
  const slots: string[] = [];
  const now = new Date();

  for (let day = 1; day <= 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const dayOfMonth = String(date.getDate()).padStart(2, "0");

    const dateString = `${year}-${month}-${dayOfMonth}`;

    slots.push(
      `${dateString}T09:00:00+08:00`,
      `${dateString}T10:30:00+08:00`,
      `${dateString}T13:00:00+08:00`,
      `${dateString}T14:30:00+08:00`,
    );
  }

  return slots;
}

export default function BookConsultationPage() {
  const router = useRouter();

  const { role, userId } = useSession();

  const doctors = useUsers((state) => state.doctors);
  const loadDoctors = useUsers((state) => state.loadDoctors);

  const {
    appointments,
    addAppointment,
    loadAppointments,
    isLoading: appointmentsLoading,
  } = useAppointments();

  const reminders = useReminders((state) => state.reminders);
  const completeReminder = useReminders((state) => state.completeReminder);

  const { followUps, updateStatus } = useFollowUps();

  const [step, setStep] = useState<Step>(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] = useState<"low" | "medium" | "high">("low");

  const [triage, setTriage] = useState<TriageIntake>({
    symptomDuration: "",
    symptoms: [],
    existingConditions: "",
    currentMedications: "",
    allergies: "",
    additionalNotes: "",
  });

  const [confirmedAppointmentId, setConfirmedAppointmentId] = useState<
    string | null
  >(null);

  const [followUpId, setFollowUpId] = useState<string | null>(null);
  const [bookingFromFollowUp, setBookingFromFollowUp] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const initializedFollowUp = useRef<string | null>(null);

  useEffect(() => {
    void Promise.all([loadAppointments(), loadDoctors()]);
  }, [loadAppointments, loadDoctors]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFollowUpId(params.get("followUp"));
  }, []);

  useEffect(() => {
    if (!followUpId || !userId) {
      return;
    }

    if (initializedFollowUp.current === followUpId) {
      return;
    }

    const reminder = reminders.find(
      (item) =>
        item.id === followUpId &&
        item.type === "follow-up" &&
        item.patientId === userId &&
        !item.completed,
    );

    if (!reminder) {
      return;
    }

    initializedFollowUp.current = followUpId;
    setBookingFromFollowUp(true);
    setReason(reminder.message);

    const recommendedDoctor = doctors.find(
      (doctor) => doctor.id === reminder.doctorId,
    );

    if (recommendedDoctor) {
      setSelectedDoctor(recommendedDoctor);
      setSelectedSlot(null);
      setStep(2);
    }
  }, [followUpId, reminders, doctors, userId]);

  const bookedSlotKeys = useMemo(() => {
    return new Set(
      appointments
        .filter((appointment) => appointment.status !== "cancelled")
        .map(
          (appointment) =>
            `${appointment.doctorId}::${new Date(
              appointment.dateTime,
            ).getTime()}`,
        ),
    );
  }, [appointments]);

  const fallbackSlots = useMemo(() => generateFallbackSlots(), []);

  function getAvailableSlots(doctor: Doctor): string[] {
    const configuredSlots = Array.isArray(doctor.availableSlots)
      ? doctor.availableSlots
      : [];

    const combinedSlots = Array.from(
      new Set([...configuredSlots, ...fallbackSlots]),
    );

    return combinedSlots
      .filter((slot) => {
        const slotTime = new Date(slot).getTime();

        if (Number.isNaN(slotTime)) {
          return false;
        }

        if (slotTime <= Date.now()) {
          return false;
        }

        const slotKey = `${doctor.id}::${slotTime}`;

        return !bookedSlotKeys.has(slotKey);
      })
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }

  const availableDoctors = useMemo(() => {
    return doctors.filter((doctor) => getAvailableSlots(doctor).length > 0);
  }, [doctors, bookedSlotKeys, fallbackSlots]);

  const availableSelectedDoctorSlots = useMemo(() => {
    if (!selectedDoctor) {
      return [];
    }

    return getAvailableSlots(selectedDoctor);
  }, [selectedDoctor, bookedSlotKeys, fallbackSlots]);

  const consultationFee = DEFAULT_CONSULTATION_FEE;

  const followUpReminder = useMemo(() => {
    if (!followUpId || !userId) {
      return undefined;
    }

    return reminders.find(
      (item) =>
        item.id === followUpId &&
        item.type === "follow-up" &&
        item.patientId === userId &&
        !item.completed,
    );
  }, [followUpId, reminders, userId]);

  if (role !== "patient" || !userId) {
    return null;
  }

  function selectDoctor(doctor: Doctor) {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setBookingError("");
    setStep(2);
  }

  function selectSlot(slot: string) {
    setSelectedSlot(slot);
    setBookingError("");
    setStep(3);
  }

  function toggleSymptom(symptom: string) {
    setTriage((current) => ({
      ...current,
      symptoms: current.symptoms.includes(symptom)
        ? current.symptoms.filter((item) => item !== symptom)
        : [...current.symptoms, symptom],
    }));
  }

  function updateTriage(field: keyof TriageIntake, value: string | string[]) {
    setTriage((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function canContinueFromTriage() {
    return (
      reason.trim().length > 0 &&
      triage.symptomDuration.trim().length > 0 &&
      triage.symptoms.length > 0
    );
  }

  async function handleConfirm() {
    if (
      !userId ||
      !selectedDoctor ||
      !selectedSlot ||
      !reason.trim() ||
      !canContinueFromTriage()
    ) {
      return;
    }

    setBookingError("");

    try {
      await loadAppointments();

      const slotAlreadyBooked = useAppointments
        .getState()
        .appointments.some(
          (appointment) =>
            appointment.doctorId === selectedDoctor.id &&
            appointment.status !== "cancelled" &&
            new Date(appointment.dateTime).getTime() ===
              new Date(selectedSlot).getTime(),
        );

      if (slotAlreadyBooked) {
        setSelectedSlot(null);
        setBookingError(
          "That appointment time was just booked by another patient. Please choose another available time.",
        );
        setStep(2);
        return;
      }

      const appointment = await addAppointment({
        patientId: userId,
        doctorId: selectedDoctor.id,
        dateTime: selectedSlot,
        reasonForVisit: reason.trim(),
        urgency,
        triage: {
          symptomDuration: triage.symptomDuration,
          symptoms: triage.symptoms,
          existingConditions: triage.existingConditions.trim(),
          currentMedications: triage.currentMedications.trim(),
          allergies: triage.allergies.trim(),
          additionalNotes: triage.additionalNotes.trim(),
        },
        consultationFee,
      });

      if (followUpReminder) {
        completeReminder(followUpReminder.id);
      }

      const bookedFollowUp = followUps.find(
        (followUp) =>
          followUp.id === followUpId &&
          followUp.patientId === userId &&
          followUp.status === "scheduled",
      );

      if (bookedFollowUp) {
        updateStatus(bookedFollowUp.id, "completed");
      }

      setConfirmedAppointmentId(appointment.id);
      setStep(5);
    } catch (error) {
      console.error("Booking failed:", error);

      setSelectedSlot(null);

      setBookingError(
        "This appointment time is no longer available. Please choose another available time.",
      );

      setStep(2);
    }
  }

  function formatDate(dateTime: string) {
    return new Date(dateTime).toLocaleDateString("en-PH", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Manila",
    });
  }

  function formatTime(dateTime: string) {
    return new Date(dateTime).toLocaleTimeString("en-PH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Manila",
    });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  return (
    <main className="page-enter px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => router.push("/patient/dashboard")}
            className="mb-4 flex items-center gap-2 text-sm text-neutral-mid transition-colors hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-dark">
                {bookingFromFollowUp
                  ? "Book Your Follow-up"
                  : "Book a Consultation"}
              </h1>

              <p className="mt-1 text-sm text-neutral-mid">
                {bookingFromFollowUp
                  ? "Choose an available time for your recommended follow-up consultation."
                  : "Choose a doctor, schedule a time, and complete your pre-appointment health information."}
              </p>
            </div>

            {bookingFromFollowUp && (
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-light/60 bg-brand-light/10 px-3 py-1.5 text-xs font-semibold text-brand-dark">
                <CalendarCheck size={14} />
                Recommended follow-up
              </div>
            )}
          </div>
        </div>

        {bookingFromFollowUp && (
          <div className="mb-8 rounded-2xl border border-brand-light/50 bg-brand-light/10 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                <Stethoscope size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-brand-dark">
                  Your practitioner recommended a follow-up
                </p>

                <p className="mt-1 text-sm leading-relaxed text-neutral-mid">
                  We&apos;ve pre-filled the reason for your follow-up. Complete
                  the health questions below so your practitioner has updated
                  information before the consultation.
                </p>
              </div>
            </div>
          </div>
        )}

        {bookingError && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />

            <div>
              <p className="text-sm font-semibold text-red-900">
                Appointment unavailable
              </p>

              <p className="mt-1 text-sm text-red-700">{bookingError}</p>
            </div>
          </div>
        )}

        {step !== 5 && (
          <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
            {[1, 2, 3, 4].map((number) => (
              <div key={number} className="flex shrink-0 items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step >= number
                      ? "bg-brand text-white"
                      : "bg-neutral-off text-neutral-mid"
                  }`}
                >
                  {number}
                </div>

                {number < 4 && (
                  <div
                    className={`h-px w-8 sm:w-10 ${
                      step > number ? "bg-brand" : "bg-neutral-off"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {step === 1 && (
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-neutral-ink">
                Choose a Doctor
              </h2>

              <p className="mt-1 text-sm text-neutral-mid">
                {bookingFromFollowUp
                  ? "Your recommended practitioner is highlighted when available."
                  : "Select a practitioner based on their specialty and location."}
              </p>
            </div>

            {appointmentsLoading ? (
              <div className="rounded-2xl border border-neutral-off bg-white p-8 text-center">
                <Clock
                  size={28}
                  className="mx-auto mb-3 animate-pulse text-brand"
                />

                <p className="font-medium text-neutral-ink">
                  Checking available schedules...
                </p>

                <p className="mt-1 text-sm text-neutral-mid">
                  Loading the latest appointment availability.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableDoctors.map((doctor) => {
                  const availableSlots = getAvailableSlots(doctor);

                  const isRecommended =
                    bookingFromFollowUp &&
                    followUpReminder?.doctorId === doctor.id;

                  return (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => selectDoctor(doctor)}
                      className={`w-full rounded-2xl border p-5 text-left transition-colors ${
                        isRecommended
                          ? "border-brand bg-brand-light/10"
                          : "border-neutral-off bg-white hover:border-brand"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-semibold text-white"
                          style={{
                            backgroundColor: doctor.avatarColor,
                          }}
                        >
                          {doctor.name
                            .replace("Dr. ", "")
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-neutral-ink">
                              {doctor.name}
                            </h3>

                            {isRecommended && (
                              <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                                Recommended
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-mid">
                            <span className="flex items-center gap-1">
                              <Stethoscope size={14} />
                              {doctor.specialty}
                            </span>

                            <span className="flex items-center gap-1">
                              <MapPin size={14} />
                              {doctor.location}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p className="text-xs text-brand-dark">
                              {availableSlots.length} available time{" "}
                              {availableSlots.length === 1 ? "slot" : "slots"}
                            </p>

                            <span className="text-xs font-semibold text-[#114084]">
                              {formatCurrency(DEFAULT_CONSULTATION_FEE)}{" "}
                              consultation
                            </span>
                          </div>
                        </div>

                        <ArrowRight
                          size={18}
                          className="mt-1 shrink-0 text-neutral-mid"
                        />
                      </div>
                    </button>
                  );
                })}

                {availableDoctors.length === 0 && (
                  <div className="rounded-2xl border border-neutral-off bg-white p-8 text-center">
                    <CalendarCheck
                      size={32}
                      className="mx-auto mb-3 text-neutral-mid"
                    />

                    <p className="font-medium text-neutral-ink">
                      No doctors are currently available.
                    </p>

                    <p className="mt-1 text-sm text-neutral-mid">
                      Please check again later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {step === 2 && selectedDoctor && (
          <section>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mb-5 flex items-center gap-2 text-sm text-neutral-mid hover:text-brand-dark"
            >
              <ArrowLeft size={15} />
              Change doctor
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-ink">
                Choose a Schedule
              </h2>

              <p className="mt-1 text-sm text-neutral-mid">
                Available times for {selectedDoctor.name}.
              </p>
            </div>

            <div className="mb-5 flex items-center justify-between rounded-2xl border border-brand-light/50 bg-brand-light/10 p-4">
              <div>
                <p className="text-xs font-medium text-neutral-mid">
                  Consultation Fee
                </p>

                <p className="mt-1 text-lg font-semibold text-brand-dark">
                  {formatCurrency(consultationFee)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs text-neutral-mid">Practitioner</p>

                <p className="mt-1 text-sm font-semibold text-neutral-ink">
                  {selectedDoctor.name}
                </p>
              </div>
            </div>

            {bookingError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <p className="text-sm text-red-700">{bookingError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {availableSelectedDoctorSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => selectSlot(slot)}
                  className="rounded-2xl border border-neutral-off bg-white p-5 text-left transition-colors hover:border-brand"
                >
                  <div className="flex items-center gap-2 text-brand-dark">
                    <CalendarCheck size={17} />
                    <span className="font-medium">{formatDate(slot)}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-sm text-neutral-mid">
                    <Clock size={15} />
                    {formatTime(slot)}
                  </div>
                </button>
              ))}
            </div>

            {availableSelectedDoctorSlots.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-900">
                  No available schedules for this practitioner
                </p>

                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  All currently listed appointment times have already been
                  booked. You can return and choose another available doctor.
                </p>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Choose Another Doctor
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>
        )}

        {step === 3 && selectedDoctor && selectedSlot && (
          <section>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mb-5 flex items-center gap-2 text-sm text-neutral-mid hover:text-brand-dark"
            >
              <ArrowLeft size={15} />
              Change schedule
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                  <FileText size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-neutral-ink">
                    Pre-appointment Triage
                  </h2>

                  <p className="mt-1 text-sm text-neutral-mid">
                    Help your practitioner understand what you&apos;re
                    experiencing before your consultation.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-[#3566AB]"
              />

              <p className="text-xs leading-relaxed text-slate-600">
                This questionnaire is for pre-appointment information only. Your
                practitioner will review your responses during the consultation.
              </p>
            </div>

            <div className="space-y-6 rounded-2xl border border-neutral-off bg-white p-6">
              <div className="rounded-xl bg-neutral-off/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-mid">
                  Appointment
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-neutral-mid">Practitioner</p>

                    <p className="mt-1 text-sm font-semibold text-neutral-ink">
                      {selectedDoctor.name}
                    </p>

                    <p className="text-xs text-neutral-mid">
                      {selectedDoctor.specialty}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">Date & Time</p>

                    <p className="mt-1 text-sm font-semibold text-neutral-ink">
                      {formatDate(selectedSlot)}
                    </p>

                    <p className="text-xs text-neutral-mid">
                      {formatTime(selectedSlot)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="reason"
                  className="mb-2 block text-sm font-medium text-neutral-ink"
                >
                  What is the main reason for your visit?
                </label>

                <textarea
                  id="reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Describe your symptoms or reason for consultation..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-neutral-off px-4 py-3 text-sm text-neutral-ink outline-none focus:border-brand"
                />

                {bookingFromFollowUp && (
                  <p className="mt-2 text-xs text-neutral-mid">
                    This was pre-filled from your practitioner&apos;s follow-up
                    recommendation. You can update it if anything has changed.
                  </p>
                )}
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-neutral-ink">
                  How long have you been experiencing this?
                </p>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {durationOptions.map((duration) => (
                    <button
                      key={duration}
                      type="button"
                      onClick={() => updateTriage("symptomDuration", duration)}
                      className={`rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                        triage.symptomDuration === duration
                          ? "border-brand bg-brand-light/10 font-medium text-brand-dark"
                          : "border-neutral-off text-neutral-mid hover:border-brand-light"
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm font-medium text-neutral-ink">
                  What symptoms are you experiencing?
                </p>

                <p className="mb-3 text-xs text-neutral-mid">
                  Select all that apply.
                </p>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {symptomOptions.map((symptom) => {
                    const selected = triage.symptoms.includes(symptom);

                    return (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleSymptom(symptom)}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                          selected
                            ? "border-brand bg-brand-light/10"
                            : "border-neutral-off hover:border-brand-light"
                        }`}
                      >
                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                            selected
                              ? "border-brand bg-brand text-white"
                              : "border-neutral-mid bg-white"
                          }`}
                        >
                          {selected && <Check size={13} strokeWidth={3} />}
                        </div>

                        <span
                          className={`text-sm ${
                            selected
                              ? "font-medium text-brand-dark"
                              : "text-neutral-ink"
                          }`}
                        >
                          {symptom}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-neutral-ink">
                  How severe are your symptoms?
                </p>

                <div className="space-y-2">
                  {urgencyOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setUrgency(option.value)}
                      className={`w-full rounded-xl border p-4 text-left transition-colors ${
                        urgency === option.value
                          ? "border-brand bg-brand-light/10"
                          : "border-neutral-off hover:border-brand-light"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            urgency === option.value
                              ? "border-brand"
                              : "border-neutral-mid"
                          }`}
                        >
                          {urgency === option.value && (
                            <div className="h-2 w-2 rounded-full bg-brand" />
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-neutral-ink">
                            {option.label}
                          </p>

                          <p className="mt-0.5 text-xs text-neutral-mid">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="existingConditions"
                  className="mb-2 block text-sm font-medium text-neutral-ink"
                >
                  Do you have any existing medical conditions?
                </label>

                <textarea
                  id="existingConditions"
                  value={triage.existingConditions}
                  onChange={(event) =>
                    updateTriage("existingConditions", event.target.value)
                  }
                  placeholder="e.g. asthma, diabetes, hypertension, or none"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-off px-4 py-3 text-sm text-neutral-ink outline-none focus:border-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="currentMedications"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-neutral-ink"
                >
                  <Pill size={15} className="text-brand" />
                  Current medications
                </label>

                <textarea
                  id="currentMedications"
                  value={triage.currentMedications}
                  onChange={(event) =>
                    updateTriage("currentMedications", event.target.value)
                  }
                  placeholder="List any medicines, supplements, or vitamins you currently take."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-off px-4 py-3 text-sm text-neutral-ink outline-none focus:border-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="allergies"
                  className="mb-2 block text-sm font-medium text-neutral-ink"
                >
                  Allergies
                </label>

                <input
                  id="allergies"
                  type="text"
                  value={triage.allergies}
                  onChange={(event) =>
                    updateTriage("allergies", event.target.value)
                  }
                  placeholder="List any known medication, food, or other allergies, or enter None."
                  className="w-full rounded-xl border border-neutral-off px-4 py-3 text-sm text-neutral-ink outline-none focus:border-brand"
                />
              </div>

              <div>
                <label
                  htmlFor="additionalNotes"
                  className="mb-2 block text-sm font-medium text-neutral-ink"
                >
                  Anything else your practitioner should know?
                </label>

                <textarea
                  id="additionalNotes"
                  value={triage.additionalNotes}
                  onChange={(event) =>
                    updateTriage("additionalNotes", event.target.value)
                  }
                  placeholder="Add any other information you think may be helpful."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-neutral-off px-4 py-3 text-sm text-neutral-ink outline-none focus:border-brand"
                />
              </div>

              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!canContinueFromTriage()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
              >
                Review Appointment
                <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {step === 4 && selectedDoctor && selectedSlot && (
          <section>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="mb-5 flex items-center gap-2 text-sm text-neutral-mid hover:text-brand-dark"
            >
              <ArrowLeft size={15} />
              Edit triage information
            </button>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-neutral-ink">
                Review & Confirm
              </h2>

              <p className="mt-1 text-sm text-neutral-mid">
                Review your appointment and pre-appointment information before
                confirming.
              </p>
            </div>

            <div className="space-y-5 rounded-2xl border border-neutral-off bg-white p-6">
              <div className="rounded-xl bg-neutral-off/50 p-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck size={16} className="text-brand" />

                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-mid">
                    Appointment
                  </p>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-neutral-mid">Practitioner</p>

                    <p className="mt-1 text-sm font-semibold text-neutral-ink">
                      {selectedDoctor.name}
                    </p>

                    <p className="text-xs text-neutral-mid">
                      {selectedDoctor.specialty}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">Date & Time</p>

                    <p className="mt-1 text-sm font-semibold text-neutral-ink">
                      {formatDate(selectedSlot)}
                    </p>

                    <p className="text-xs text-neutral-mid">
                      {formatTime(selectedSlot)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-mid">
                  Reason for Visit
                </p>

                <p className="mt-2 text-sm leading-relaxed text-neutral-ink">
                  {reason}
                </p>
              </div>

              <div className="border-t border-neutral-off pt-5">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-brand" />

                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-mid">
                    Pre-appointment Triage
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs text-neutral-mid">Symptom duration</p>

                    <p className="mt-1 text-sm font-medium text-neutral-ink">
                      {triage.symptomDuration}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">Symptoms</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {triage.symptoms.map((symptom) => (
                        <span
                          key={symptom}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-[#3566AB]"
                        >
                          {symptom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">Severity</p>

                    <p className="mt-1 text-sm font-medium capitalize text-neutral-ink">
                      {urgency}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">
                      Existing conditions
                    </p>

                    <p className="mt-1 text-sm text-neutral-ink">
                      {triage.existingConditions || "None provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">
                      Current medications
                    </p>

                    <p className="mt-1 text-sm text-neutral-ink">
                      {triage.currentMedications || "None provided"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-neutral-mid">Allergies</p>

                    <p className="mt-1 text-sm text-neutral-ink">
                      {triage.allergies || "None provided"}
                    </p>
                  </div>

                  {triage.additionalNotes && (
                    <div>
                      <p className="text-xs text-neutral-mid">
                        Additional notes
                      </p>

                      <p className="mt-1 text-sm leading-relaxed text-neutral-ink">
                        {triage.additionalNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-brand-light/40 bg-brand-light/10 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">
                      Consultation Fee
                    </p>

                    <p className="mt-1 text-xs text-neutral-mid">
                      Payment processing is simulated in this prototype.
                    </p>
                  </div>

                  <p className="text-lg font-bold text-brand-dark">
                    {formatCurrency(consultationFee)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
              >
                Confirm Appointment
                <Check size={16} />
              </button>
            </div>
          </section>
        )}

        {step === 5 && selectedDoctor && selectedSlot && (
          <section className="mx-auto max-w-xl">
            <div className="rounded-2xl border border-neutral-off bg-white p-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={28} />
              </div>

              <h2 className="text-xl font-semibold text-brand-dark">
                {bookingFromFollowUp
                  ? "Follow-up Booked"
                  : "Appointment Confirmed"}
              </h2>

              <p className="mt-2 text-sm text-neutral-mid">
                {bookingFromFollowUp
                  ? "Your recommended follow-up has been successfully scheduled."
                  : "Your consultation has been successfully scheduled."}
              </p>

              <div className="mt-6 space-y-4 rounded-xl bg-neutral-off/50 p-5 text-left">
                <div>
                  <p className="text-xs text-neutral-mid">Practitioner</p>

                  <p className="mt-1 text-sm font-semibold text-neutral-ink">
                    {selectedDoctor.name}
                  </p>

                  <p className="text-xs text-neutral-mid">
                    {selectedDoctor.specialty}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-mid">Date & Time</p>

                  <p className="mt-1 text-sm font-semibold text-neutral-ink">
                    {formatDate(selectedSlot)}
                  </p>

                  <p className="text-xs text-neutral-mid">
                    {formatTime(selectedSlot)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-neutral-mid">Reason for Visit</p>

                  <p className="mt-1 text-sm text-neutral-ink">{reason}</p>
                </div>

                <div>
                  <p className="text-xs text-neutral-mid">Triage Information</p>

                  <p className="mt-1 text-sm text-neutral-ink">
                    {triage.symptoms.length} symptom{" "}
                    {triage.symptoms.length === 1 ? "reported" : "reported"} ·{" "}
                    {triage.symptomDuration}
                  </p>
                </div>

                <div className="border-t border-neutral-off pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-neutral-mid">
                      Consultation Fee
                    </span>

                    <span className="text-sm font-bold text-brand-dark">
                      {formatCurrency(consultationFee)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/patient/appointments")}
                  className="flex-1 rounded-xl bg-brand py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                >
                  View Appointment
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/patient/dashboard")}
                  className="flex-1 rounded-xl border border-neutral-off py-3 text-sm font-medium text-neutral-ink transition-colors hover:border-brand"
                >
                  Back to Dashboard
                </button>
              </div>

              {confirmedAppointmentId && (
                <p className="mt-4 text-[11px] text-neutral-mid">
                  Appointment ID: {confirmedAppointmentId}
                </p>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
