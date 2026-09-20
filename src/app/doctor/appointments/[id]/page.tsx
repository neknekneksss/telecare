"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  HeartPulse,
  Loader2,
  Pill,
  Stethoscope,
  User,
  Video,
  X,
  AlertCircle,
  Save,
  StickyNote,
  ClipboardCheck,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useClinicalNotes } from "@/store/clinicalNotes";
import { usePrescriptions } from "@/store/prescriptions";
import { useFollowUps } from "@/store/followUps";
import { useReminders } from "@/store/reminders";

export default function DoctorAppointmentPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = useSession();

  const { doctors, patients } = useUsers();

  const { appointments, updateAppointment } = useAppointments();

  const { clinicalNotes, addClinicalNote } = useClinicalNotes();

  const { prescriptions, addPrescription } = usePrescriptions();

  const {
    followUps,
    addFollowUp,
    updateFollowUp,
    updateStatus,
    loadFollowUps,
  } = useFollowUps();

  const {
    reminders,
    addReminder,
    updateReminder,
    deleteReminder,
    loadReminders,
  } = useReminders();

  const [relatedDataLoaded, setRelatedDataLoaded] = useState(false);
  const [followUpFormHydrated, setFollowUpFormHydrated] = useState(false);
  const [relatedDataError, setRelatedDataError] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [showVideoModal, setShowVideoModal] = useState(false);

  const appointment = appointments.find((item) => item.id === params.id);

  const currentDoctor = doctors.find((doctor) => doctor.id === userId);

  const patient = appointment
    ? patients.find((item) => item.id === appointment.patientId)
    : undefined;

  const existingNote = clinicalNotes.find(
    (note) => note.appointmentId === params.id,
  );

  const existingPrescription = prescriptions.find(
    (prescription) => prescription.appointmentId === params.id,
  );

  const existingFollowUp = followUps.find(
    (followUp) => followUp.appointmentId === params.id,
  );

  const existingFollowUpReminder = reminders.find(
    (reminder) =>
      reminder.type === "follow-up" &&
      reminder.relatedAppointmentId === params.id,
  );

  /*
   * ---------------------------------------------------------
   * Clinical note form
   * ---------------------------------------------------------
   */

  const [bloodPressure, setBloodPressure] = useState(
    existingNote?.vitals?.bloodPressure || "",
  );

  const [heartRate, setHeartRate] = useState(
    existingNote?.vitals?.heartRate
      ? String(existingNote.vitals.heartRate)
      : "",
  );

  const [temperature, setTemperature] = useState(
    existingNote?.vitals?.temperature
      ? String(existingNote.vitals.temperature)
      : "",
  );

  const [diagnosis, setDiagnosis] = useState(existingNote?.diagnosis || "");

  const [treatmentPlan, setTreatmentPlan] = useState(
    existingNote?.treatmentPlan || "",
  );

  const [doctorNotes, setDoctorNotes] = useState(
    existingNote?.doctorNotes || "",
  );

  /*
   * ---------------------------------------------------------
   * Prescription form
   * ---------------------------------------------------------
   */

  const [medication, setMedication] = useState(
    existingPrescription?.medication || "",
  );

  const [dosage, setDosage] = useState(existingPrescription?.dosage || "");

  const [schedule, setSchedule] = useState(
    existingPrescription?.schedule || "",
  );

  const [nextDose, setNextDose] = useState(
    existingPrescription?.nextDose || "",
  );

  const [refillReminder, setRefillReminder] = useState("");

  /*
   * ---------------------------------------------------------
   * Follow-up form
   * ---------------------------------------------------------
   */

  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);

  const [followUpDateTime, setFollowUpDateTime] = useState("");

  const [followUpReason, setFollowUpReason] = useState("");

  const [followUpNotes, setFollowUpNotes] = useState("");

  /*
   * ---------------------------------------------------------
   * Load Supabase-backed follow-ups + reminders
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!userId || relatedDataLoaded) {
      return;
    }

    let cancelled = false;

    const loadRelatedData = async () => {
      setRelatedDataError("");

      try {
        await Promise.all([loadFollowUps(), loadReminders()]);

        if (!cancelled) {
          setRelatedDataLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load follow-ups or reminders:", error);

        if (!cancelled) {
          setRelatedDataError(
            "Follow-up information could not be loaded. Please refresh and try again.",
          );
        }
      }
    };

    void loadRelatedData();

    return () => {
      cancelled = true;
    };
  }, [userId, relatedDataLoaded, loadFollowUps, loadReminders]);

  /*
   * ---------------------------------------------------------
   * Hydrate follow-up form AFTER Supabase data has loaded.
   *
   * This prevents the original bug where existingFollowUp was
   * undefined during the first render and the form stayed empty.
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!relatedDataLoaded || followUpFormHydrated) {
      return;
    }

    const followUp = followUps.find((item) => item.appointmentId === params.id);

    if (followUp) {
      setScheduleFollowUp(followUp.status === "scheduled");

      setFollowUpDateTime(
        followUp.scheduledFor
          ? new Date(followUp.scheduledFor).toISOString().slice(0, 16)
          : "",
      );

      setFollowUpReason(followUp.reason || "");

      setFollowUpNotes(followUp.notes || "");
    } else {
      setScheduleFollowUp(false);
      setFollowUpDateTime("");
      setFollowUpReason("");
      setFollowUpNotes("");
    }

    setFollowUpFormHydrated(true);
  }, [relatedDataLoaded, followUpFormHydrated, followUps, params.id]);

  /*
   * ---------------------------------------------------------
   * Existing note / prescription hydration
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!existingNote) {
      return;
    }

    setBloodPressure(existingNote.vitals?.bloodPressure || "");

    setHeartRate(
      existingNote.vitals?.heartRate
        ? String(existingNote.vitals.heartRate)
        : "",
    );

    setTemperature(
      existingNote.vitals?.temperature
        ? String(existingNote.vitals.temperature)
        : "",
    );

    setDiagnosis(existingNote.diagnosis || "");

    setTreatmentPlan(existingNote.treatmentPlan || "");

    setDoctorNotes(existingNote.doctorNotes || "");
  }, [existingNote]);

  useEffect(() => {
    if (!existingPrescription) {
      return;
    }

    setMedication(existingPrescription.medication || "");

    setDosage(existingPrescription.dosage || "");

    setSchedule(existingPrescription.schedule || "");

    setNextDose(existingPrescription.nextDose || "");

    if (existingPrescription.refillRemindAt) {
      const refillDate = new Date(existingPrescription.refillRemindAt);

      if (!Number.isNaN(refillDate.getTime())) {
        const today = new Date();

        const diffDays = Math.ceil(
          (refillDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (diffDays > 0) {
          setRefillReminder(String(diffDays));
        }
      }
    }
  }, [existingPrescription]);

  /*
   * ---------------------------------------------------------
   * Validation
   * ---------------------------------------------------------
   */

  const validateConsultation = () => {
    const bp = bloodPressure.trim();
    const hr = heartRate.trim();
    const temp = temperature.trim();
    const diag = diagnosis.trim();
    const treatment = treatmentPlan.trim();
    const notes = doctorNotes.trim();

    const bpMatch = bp.match(/^(\d{2,3})\/(\d{2,3})$/);

    if (!bpMatch) {
      return "Blood pressure must use the format 120/80.";
    }

    const systolic = Number(bpMatch[1]);
    const diastolic = Number(bpMatch[2]);

    if (systolic < 70 || systolic > 250 || diastolic < 40 || diastolic > 150) {
      return "Please enter a valid blood pressure reading.";
    }

    if (!/^\d+$/.test(hr)) {
      return "Heart rate must be a whole number.";
    }

    const heartRateValue = Number(hr);

    if (heartRateValue < 30 || heartRateValue > 220) {
      return "Please enter a valid heart rate between 30 and 220 bpm.";
    }

    if (!/^\d{2}(\.\d)?$/.test(temp)) {
      return "Temperature must be entered as a valid number, such as 37.1.";
    }

    const temperatureValue = Number(temp);

    if (temperatureValue < 30 || temperatureValue > 45) {
      return "Please enter a valid temperature between 30°C and 45°C.";
    }

    if (diag.length < 3 || diag.length > 500) {
      return "Diagnosis must be between 3 and 500 characters.";
    }

    if (treatment.length < 5 || treatment.length > 2000) {
      return "Treatment plan must be between 5 and 2000 characters.";
    }

    if (notes.length > 2000) {
      return "Doctor notes cannot exceed 2000 characters.";
    }

    /*
     * Prescription validation
     */

    if (medication.trim()) {
      const medicationValue = medication.trim();

      if (medicationValue.length < 2 || medicationValue.length > 100) {
        return "Medication name must be between 2 and 100 characters.";
      }

      if (!/^[a-zA-Z0-9\s+().,'/-]+$/.test(medicationValue)) {
        return "Medication contains invalid characters.";
      }

      if (!dosage.trim()) {
        return "Please enter the medication dosage.";
      }

      if (dosage.trim().length > 100) {
        return "Dosage cannot exceed 100 characters.";
      }

      if (!/^[a-zA-Z0-9\s+().,'/-]+$/.test(dosage.trim())) {
        return "Dosage contains invalid characters.";
      }

      const validSchedules = [
        "1x daily",
        "2x daily",
        "3x daily",
        "4x daily",
        "Every 4 hours",
        "Every 6 hours",
        "Every 8 hours",
        "Every 12 hours",
        "As needed",
      ];

      if (!validSchedules.includes(schedule)) {
        return "Please select a valid medication schedule.";
      }

      if (!/^\d{2}:\d{2}$/.test(nextDose)) {
        return "Please enter the next dose time.";
      }

      if (refillReminder.trim()) {
        const refillDays = Number(refillReminder);

        if (
          !Number.isInteger(refillDays) ||
          refillDays < 1 ||
          refillDays > 365
        ) {
          return "Refill reminder must be between 1 and 365 days.";
        }
      }
    }

    /*
     * Follow-up validation
     */

    if (scheduleFollowUp) {
      if (!followUpDateTime) {
        return "Please select a follow-up date and time.";
      }

      const followUpDate = new Date(followUpDateTime);

      if (
        Number.isNaN(followUpDate.getTime()) ||
        followUpDate.getTime() <= Date.now()
      ) {
        return "Follow-up date and time must be in the future.";
      }

      const reason = followUpReason.trim();

      if (reason.length < 3 || reason.length > 500) {
        return "Follow-up reason must be between 3 and 500 characters.";
      }

      if (followUpNotes.trim().length > 1000) {
        return "Follow-up notes cannot exceed 1000 characters.";
      }
    }

    return "";
  };

  /*
   * ---------------------------------------------------------
   * Save consultation
   * ---------------------------------------------------------
   */

  const handleSaveConsultation = async () => {
    if (!appointment || !patient || !currentDoctor) {
      return;
    }

    if (!relatedDataLoaded) {
      setValidationError(
        "Follow-up information is still loading. Please wait a moment and try again.",
      );

      return;
    }

    setValidationError("");
    setSaved(false);

    const error = validateConsultation();

    if (error) {
      setValidationError(error);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      /*
       * Clinical note
       */

      await Promise.resolve(
        addClinicalNote({
          appointmentId: appointment.id,
          vitals: {
            bloodPressure: bloodPressure.trim(),
            heartRate: Number(heartRate),
            temperature: Number(temperature),
          },
          diagnosis: diagnosis.trim(),
          treatmentPlan: treatmentPlan.trim(),
          doctorNotes: doctorNotes.trim() || undefined,
        }),
      );

      /*
       * Prescription
       */

      if (medication.trim()) {
        let refillRemindAt: string | undefined;

        if (refillReminder.trim()) {
          const refillDays = Number(refillReminder);

          if (Number.isInteger(refillDays)) {
            const refillDate = new Date();

            refillDate.setDate(refillDate.getDate() + refillDays);

            refillRemindAt = refillDate.toISOString();
          }
        }

        await Promise.resolve(
          addPrescription({
            patientId: patient.id,
            appointmentId: appointment.id,
            medication: medication.trim(),
            dosage: dosage.trim(),
            schedule: schedule.trim(),
            nextDose: nextDose.trim(),
            refillRemindAt,
          }),
        );
      }

      /*
       * Follow-up + reminder
       */

      if (scheduleFollowUp) {
        const scheduledFor = new Date(followUpDateTime).toISOString();

        const followUpData = {
          patientId: patient.id,
          doctorId: currentDoctor.id,
          appointmentId: appointment.id,
          scheduledFor,
          reason: followUpReason.trim(),
          notes: followUpNotes.trim() || undefined,
          status: "scheduled" as const,
        };

        if (existingFollowUp) {
          await updateFollowUp(existingFollowUp.id, followUpData);
        } else {
          const followUpId =
            typeof globalThis.crypto?.randomUUID === "function"
              ? globalThis.crypto.randomUUID()
              : `followup-${Date.now()}`;

          await addFollowUp({
            id: followUpId,
            createdAt: new Date().toISOString(),
            ...followUpData,
          });
        }

        /*
         * Keep the patient reminder synchronized with
         * the follow-up record.
         */

        const reminderMessage = followUpNotes.trim()
          ? `${followUpReason.trim()} ${followUpNotes.trim()}`
          : followUpReason.trim();

        const reminderData = {
          patientId: patient.id,
          doctorId: currentDoctor.id,
          type: "follow-up" as const,
          title: "Follow-up appointment recommended",
          message: reminderMessage,
          dueDate: scheduledFor,
          relatedAppointmentId: appointment.id,
        };

        if (existingFollowUpReminder) {
          await updateReminder(existingFollowUpReminder.id, {
            ...reminderData,
            completed: false,
          });
        } else {
          await addReminder(reminderData);
        }
      } else if (existingFollowUp && existingFollowUp.status === "scheduled") {
        await updateStatus(existingFollowUp.id, "cancelled");

        if (existingFollowUpReminder) {
          await deleteReminder(existingFollowUpReminder.id);
        }
      }

      /*
       * Complete appointment only after the consultation
       * data has successfully been persisted.
       */

      await Promise.resolve(
        updateAppointment(appointment.id, {
          status: "completed",
        }),
      );

      setSaved(true);
    } catch (error) {
      console.error("Failed to save consultation:", error);

      setValidationError(
        "The consultation could not be saved. Please check your connection and try again.",
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * Access checks
   * ---------------------------------------------------------
   */

  if (!userId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Loading practitioner session...
        </div>
      </main>
    );
  }

  if (!appointment) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Link
            href="/doctor/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3566AB] hover:text-[#28548F]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertCircle size={22} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-[#1C1C1C]">
              Appointment not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              This appointment may no longer exist or may not be available to
              the current practitioner.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!patient) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Link
            href="/doctor/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3566AB] hover:text-[#28548F]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <User size={22} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-[#1C1C1C]">
              Patient not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              The patient associated with this appointment could not be found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const appointmentDate = new Date(appointment.dateTime);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}

        <section className="mb-6">
          <Link
            href="/doctor/dashboard"
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#3566AB] hover:text-[#28548F]"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-[#3566AB]">
                Practitioner Dashboard
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1C] sm:text-3xl">
                Consultation
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Review the patient information and record the consultation
                findings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
                <CalendarDays size={16} />
                {appointmentDate.toLocaleDateString("en-PH", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm">
                <Clock3 size={16} />
                {appointmentDate.toLocaleTimeString("en-PH", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowVideoModal(true)}
                className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#28548F]"
              >
                <Video size={16} />
                Start video
              </button>
            </div>
          </div>
        </section>

        {/* Error */}

        {(validationError || relatedDataError) && (
          <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

              <div>
                <p className="text-sm font-bold text-red-800">
                  Unable to save consultation
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {validationError || relatedDataError}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Success */}

        {saved && (
          <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Consultation saved successfully
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  The consultation has been completed and the patient follow-up
                  information has been saved.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Patient hero */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#83B7DE]/20 text-[#3566AB]">
                  <User size={30} />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Patient
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#1C1C1C]">
                    {patient.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {patient.email || "Patient account"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                    appointment.status === "completed"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-blue-50 text-[#3566AB]"
                  }`}
                >
                  {appointment.status}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Appointment context */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Appointment details
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                Consultation context
              </h2>
            </div>

            <ClipboardList size={19} className="text-[#3566AB]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">Date</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {appointmentDate.toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">Time</p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {appointmentDate.toLocaleTimeString("en-PH", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">
                Practitioner
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                Dr.{" "}
                {currentDoctor?.name?.replace(/^Dr\.?\s*/i, "") ||
                  "Practitioner"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-400">
                Appointment ID
              </p>

              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {appointment.id}
              </p>
            </div>
          </div>

          {appointment.reasonForVisit && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Patient concern
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {appointment.reasonForVisit}
              </p>
            </div>
          )}
        </section>

        {/* Pre-consultation / triage */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pre-consultation
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                Patient intake and triage
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review the information submitted by the patient before recording
                clinical findings.
              </p>
            </div>

            <HeartPulse size={20} className="text-[#3566AB]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Primary concern
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {appointment.reasonForVisit || "No concern was provided."}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Patient
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-800">
                {patient.name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Review the patient&apos;s submitted information before
                completing the consultation.
              </p>
            </div>
          </div>
        </section>

        {/* Clinical Notes */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Clinical documentation
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                Clinical notes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Record the patient&apos;s vital signs, diagnosis, and treatment
                plan.
              </p>
            </div>

            <FileText size={20} className="text-[#3566AB]" />
          </div>

          <div className="grid gap-5">
            <div>
              <label
                htmlFor="bloodPressure"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Blood pressure
              </label>

              <input
                id="bloodPressure"
                type="text"
                value={bloodPressure}
                onChange={(event) => setBloodPressure(event.target.value)}
                placeholder="120/80"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="heartRate"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Heart rate
                </label>

                <div className="relative">
                  <input
                    id="heartRate"
                    type="number"
                    min={30}
                    max={220}
                    value={heartRate}
                    onChange={(event) => setHeartRate(event.target.value)}
                    placeholder="72"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-14 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    bpm
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="temperature"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Temperature
                </label>

                <div className="relative">
                  <input
                    id="temperature"
                    type="number"
                    min={30}
                    max={45}
                    step="0.1"
                    value={temperature}
                    onChange={(event) => setTemperature(event.target.value)}
                    placeholder="37.0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    °C
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="diagnosis"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Diagnosis
              </label>

              <textarea
                id="diagnosis"
                value={diagnosis}
                onChange={(event) => setDiagnosis(event.target.value)}
                rows={3}
                placeholder="Enter the patient's diagnosis..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
              />
            </div>

            <div>
              <label
                htmlFor="treatmentPlan"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Treatment plan
              </label>

              <textarea
                id="treatmentPlan"
                value={treatmentPlan}
                onChange={(event) => setTreatmentPlan(event.target.value)}
                rows={4}
                placeholder="Describe the recommended treatment and care instructions..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
              />
            </div>

            <div>
              <label
                htmlFor="doctorNotes"
                className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
              >
                <StickyNote size={15} />
                Doctor notes
              </label>

              <textarea
                id="doctorNotes"
                value={doctorNotes}
                onChange={(event) => setDoctorNotes(event.target.value)}
                rows={4}
                placeholder="Optional private consultation notes..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
              />
            </div>
          </div>
        </section>

        {/* Prescription */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Medication
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                Prescription
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add medication instructions for the patient.
              </p>
            </div>

            <Pill size={20} className="text-[#3566AB]" />
          </div>

          <div className="grid gap-5">
            <div>
              <label
                htmlFor="medication"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Medication
              </label>

              <input
                id="medication"
                type="text"
                value={medication}
                onChange={(event) => setMedication(event.target.value)}
                placeholder="e.g. Amoxicillin"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="dosage"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Dosage
                </label>

                <input
                  id="dosage"
                  type="text"
                  value={dosage}
                  onChange={(event) => setDosage(event.target.value)}
                  placeholder="e.g. 500 mg"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="schedule"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Schedule
                </label>

                <select
                  id="schedule"
                  value={schedule}
                  onChange={(event) => setSchedule(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                >
                  <option value="">Select schedule</option>
                  <option value="1x daily">1x daily</option>
                  <option value="2x daily">2x daily</option>
                  <option value="3x daily">3x daily</option>
                  <option value="4x daily">4x daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nextDose"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Next dose
                </label>

                <input
                  id="nextDose"
                  type="time"
                  value={nextDose}
                  onChange={(event) => setNextDose(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="refillReminder"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Refill reminder
                </label>

                <div className="relative">
                  <input
                    id="refillReminder"
                    type="number"
                    min={1}
                    max={365}
                    value={refillReminder}
                    onChange={(event) => setRefillReminder(event.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Follow-up Care */}

        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Follow-up care
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                Follow-up appointment
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Schedule another consultation and notify the patient.
              </p>
            </div>

            <ClipboardCheck size={20} className="text-[#3566AB]" />
          </div>

          {!relatedDataLoaded ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Loader2 size={17} className="animate-spin" />
                Loading follow-up information...
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={scheduleFollowUp}
                  onChange={(event) =>
                    setScheduleFollowUp(event.target.checked)
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#3566AB] focus:ring-[#3566AB]"
                />

                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Schedule a follow-up appointment
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    The patient will receive a follow-up reminder through
                    TeleCare.
                  </span>
                </span>
              </label>

              {scheduleFollowUp && (
                <div className="grid gap-5">
                  <div>
                    <label
                      htmlFor="followUpDateTime"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Follow-up date and time
                    </label>

                    <input
                      id="followUpDateTime"
                      type="datetime-local"
                      value={followUpDateTime}
                      onChange={(event) =>
                        setFollowUpDateTime(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="followUpReason"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Reason for follow-up
                    </label>

                    <textarea
                      id="followUpReason"
                      value={followUpReason}
                      onChange={(event) =>
                        setFollowUpReason(event.target.value)
                      }
                      rows={3}
                      placeholder="e.g. Recheck symptoms and review medication response"
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="followUpNotes"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Follow-up notes
                    </label>

                    <textarea
                      id="followUpNotes"
                      value={followUpNotes}
                      onChange={(event) => setFollowUpNotes(event.target.value)}
                      rows={3}
                      placeholder="Optional instructions for the patient's next visit..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-[#83B7DE] focus:ring-2 focus:ring-[#83B7DE]/20"
                    />
                  </div>
                </div>
              )}

              {existingFollowUp && existingFollowUp.status === "cancelled" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm font-semibold text-amber-800">
                    Previous follow-up cancelled
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Enabling the follow-up option above will create a new
                    scheduled follow-up for this consultation.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Save */}

        <section className="mb-6 rounded-2xl border border-[#83B7DE]/40 bg-[#83B7DE]/10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#3566AB]">
                Complete consultation
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                Save clinical findings
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Saving this consultation will mark the appointment as completed
                and synchronize the recorded follow-up information with the
                patient account.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveConsultation}
              disabled={isSaving || !relatedDataLoaded || !followUpFormHydrated}
              className="telecare-button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#28548F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 size={17} />
                  Saved
                </>
              ) : (
                <>
                  <Save size={17} />
                  Save & complete
                </>
              )}
            </button>
          </div>
        </section>

        {/* Prototype Notice */}

        <section className="rounded-2xl border border-[#83B7DE]/40 bg-[#83B7DE]/10 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <Stethoscope size={18} className="text-[#3566AB]" />
            </div>

            <div>
              <p className="text-sm font-bold text-[#1C1C1C]">
                TeleCare practitioner workspace
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Video consultations are simulated for this presentation.
                Follow-up information is stored in the prototype database, while
                other patient record features remain part of the prototype.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Simulated Video Modal */}

      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-sky-300">
                  TeleCare Video
                </p>

                <h3 className="mt-1 font-bold text-white">
                  Simulated consultation
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-2 border-sky-400 bg-sky-500/20 text-3xl text-sky-300">
                <User size={38} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-white">
                {patient.name}
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                TeleCare video channel
              </p>

              <div className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-xs text-slate-300">
                This video call is simulated for the presentation prototype.
              </div>

              <button
                type="button"
                onClick={() => setShowVideoModal(false)}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700"
              >
                <X size={16} />
                End simulated call
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
