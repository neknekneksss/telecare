"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MessageCircle,
  Star,
  Stethoscope,
  Video,
  X,
} from "lucide-react";
import { useState } from "react";

import { useSession } from "@/store/session";
import { useAppointments } from "@/store/appointments";
import { useUsers } from "@/store/users";
import { useReminders } from "@/store/reminders";
import { useRatings } from "@/store/ratings";

export default function PatientAppointmentsPage() {
  const { role, userId } = useSession();
  const { appointments } = useAppointments();
  const { doctors } = useUsers();
  const { reminders } = useReminders();
  const { ratings, addRating } = useRatings();

  const [ratingAppointmentId, setRatingAppointmentId] = useState<string | null>(
    null,
  );
  const [selectedRating, setSelectedRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  if (role !== "patient" || !userId) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="telecare-card w-full max-w-md p-8 text-center">
            <h1 className="text-xl font-bold text-[#1C1C1C]">
              Patient access required
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Please sign in with a patient account to view your appointments.
            </p>

            <Link
              href="/login"
              className="telecare-button mt-6 inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Preserve the narrowed non-null user ID for nested functions.
  const patientId = userId;

  const myAppointments = appointments
    .filter((appointment) => appointment.patientId === patientId)
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );

  const upcomingAppointments = myAppointments
    .filter((appointment) => appointment.status === "upcoming")
    .sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    );

  const completedAppointments = myAppointments
    .filter((appointment) => appointment.status === "completed")
    .sort(
      (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
    );

  const followUpReminders = reminders
    .filter(
      (reminder) =>
        reminder.patientId === patientId &&
        reminder.type === "follow-up" &&
        !reminder.completed,
    )
    .filter((reminder) => {
      const relatedAppointment = reminder.relatedAppointmentId
        ? appointments.find(
            (appointment) => appointment.id === reminder.relatedAppointmentId,
          )
        : undefined;

      const hasBookedFollowUp = appointments.some(
        (appointment) =>
          appointment.patientId === patientId &&
          appointment.status === "upcoming" &&
          appointment.doctorId === reminder.doctorId &&
          appointment.id !== reminder.relatedAppointmentId &&
          relatedAppointment &&
          new Date(appointment.dateTime).getTime() >
            new Date(relatedAppointment.dateTime).getTime(),
      );

      return !hasBookedFollowUp;
    })
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  function openRating(appointmentId: string) {
    const existingRating = ratings.find(
      (rating) => rating.appointmentId === appointmentId,
    );

    setRatingAppointmentId(appointmentId);
    setSelectedRating(existingRating?.rating ?? 0);
    setFeedback(existingRating?.feedback ?? "");
    setRatingSubmitted(false);
  }

  function closeRating() {
    setRatingAppointmentId(null);
    setSelectedRating(0);
    setFeedback("");
    setRatingSubmitted(false);
  }

  function submitRating() {
    if (!ratingAppointmentId || selectedRating < 1) {
      return;
    }

    const appointment = appointments.find(
      (item) => item.id === ratingAppointmentId,
    );

    if (!appointment) {
      return;
    }

    addRating({
      appointmentId: appointment.id,
      patientId,
      doctorId: appointment.doctorId,
      rating: selectedRating,
      feedback,
    });

    setRatingSubmitted(true);
  }

  return (
    <main className="page-enter min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/patient/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#3566AB]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#3566AB]">
                Patient Care
              </p>

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1C1C1C] sm:text-3xl">
                Appointments
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                Manage your upcoming consultations, review completed visits, and
                continue your recommended care.
              </p>
            </div>

            <Link
              href="/patient/book"
              className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
            >
              <CalendarDays size={17} />
              Book Consultation
            </Link>
          </div>
        </div>

        {/* Recommended Follow-ups */}
        {followUpReminders.length > 0 && (
          <section className="fade-up mb-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#1C1C1C]">
                  Recommended Follow-ups
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Continue the care recommended by your practitioner.
                </p>
              </div>

              <div className="hidden items-center gap-2 rounded-full bg-[#F1F1F1] px-3 py-1.5 text-xs font-semibold text-slate-500 sm:flex">
                <CalendarCheck size={14} />
                {followUpReminders.length}{" "}
                {followUpReminders.length === 1
                  ? "recommendation"
                  : "recommendations"}
              </div>
            </div>

            <div className="grid gap-4">
              {followUpReminders.map((reminder) => {
                const doctor = reminder.doctorId
                  ? doctors.find((item) => item.id === reminder.doctorId)
                  : undefined;

                return (
                  <div
                    key={reminder.id}
                    className="telecare-card overflow-hidden border-[#83B7DE]/40 bg-white"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#83B7DE]/15 text-[#3566AB]">
                              <CalendarCheck size={21} />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-base font-bold text-[#1C1C1C]">
                                {reminder.title}
                              </h3>

                              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                                {reminder.message}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                            {doctor && (
                              <span className="inline-flex items-center gap-1.5">
                                <Stethoscope size={14} />
                                {doctor.name}
                              </span>
                            )}

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3 size={14} />
                              {formatDateTime(reminder.dueDate)}
                            </span>
                          </div>
                        </div>

                        <Link
                          href={`/patient/book?followUp=${encodeURIComponent(
                            reminder.id,
                          )}`}
                          className="telecare-button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                        >
                          Book Follow-up
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Upcoming Consultations */}
        <section className="fade-up mb-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1C1C1C]">
                Upcoming Consultations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your scheduled TeleCare appointments.
              </p>
            </div>

            {upcomingAppointments.length > 0 && (
              <span className="hidden rounded-full bg-[#F1F1F1] px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline-flex">
                {upcomingAppointments.length} scheduled
              </span>
            )}
          </div>

          {upcomingAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={24} />}
              title="No upcoming consultations"
              description="You don't have any upcoming appointments right now."
              action={
                <Link
                  href="/patient/book"
                  className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
                >
                  Book Consultation
                  <ArrowRight size={16} />
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4">
              {upcomingAppointments.map((appointment) => {
                const doctor = doctors.find(
                  (item) => item.id === appointment.doctorId,
                );

                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    doctorName={doctor?.name ?? "Your Doctor"}
                    doctorSpecialty={
                      doctor?.specialty ?? "Healthcare Practitioner"
                    }
                    rating={undefined}
                    onRate={() => undefined}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Completed Consultations */}
        <section className="fade-up">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#1C1C1C]">
                Completed Consultations
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review your previous consultations and share your experience.
              </p>
            </div>

            {completedAppointments.length > 0 && (
              <span className="hidden rounded-full bg-[#F1F1F1] px-3 py-1.5 text-xs font-semibold text-slate-500 sm:inline-flex">
                {completedAppointments.length} completed
              </span>
            )}
          </div>

          {completedAppointments.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={24} />}
              title="No completed consultations"
              description="Completed consultations will appear here after your visits."
            />
          ) : (
            <div className="grid gap-4">
              {completedAppointments.map((appointment) => {
                const doctor = doctors.find(
                  (item) => item.id === appointment.doctorId,
                );

                const rating = ratings.find(
                  (item) => item.appointmentId === appointment.id,
                );

                return (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    doctorName={doctor?.name ?? "Your Doctor"}
                    doctorSpecialty={
                      doctor?.specialty ?? "Healthcare Practitioner"
                    }
                    rating={rating}
                    onRate={() => openRating(appointment.id)}
                    ratingAppointmentId={ratingAppointmentId}
                    selectedRating={selectedRating}
                    feedback={feedback}
                    ratingSubmitted={ratingSubmitted}
                    onRatingChange={setSelectedRating}
                    onFeedbackChange={setFeedback}
                    onSubmitRating={submitRating}
                    onCloseRating={closeRating}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

interface AppointmentCardProps {
  appointment: {
    id: string;
    patientId: string;
    doctorId: string;
    dateTime: string;
    status: string;
    reasonForVisit: string;
    urgency: "low" | "medium" | "high";
  };
  doctorName: string;
  doctorSpecialty: string;
  rating?: {
    id?: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
    rating: number;
    feedback?: string;
  };
  onRate: () => void;

  ratingAppointmentId?: string | null;
  selectedRating?: number;
  feedback?: string;
  ratingSubmitted?: boolean;
  onRatingChange?: (rating: number) => void;
  onFeedbackChange?: (feedback: string) => void;
  onSubmitRating?: () => void;
  onCloseRating?: () => void;
}

function AppointmentCard({
  appointment,
  doctorName,
  doctorSpecialty,
  rating,
  onRate,
  ratingAppointmentId,
  selectedRating = 0,
  feedback = "",
  ratingSubmitted = false,
  onRatingChange,
  onFeedbackChange,
  onSubmitRating,
  onCloseRating,
}: AppointmentCardProps) {
  const isCompleted = appointment.status === "completed";
  const isRatingOpen = ratingAppointmentId === appointment.id;

  return (
    <div className="telecare-card overflow-hidden bg-white">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5">
          {/* Appointment Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#83B7DE]/15 text-[#3566AB]">
                <Stethoscope size={21} />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-base font-bold text-[#1C1C1C]">
                  {doctorName}
                </h3>

                <p className="mt-0.5 text-sm text-slate-500">
                  {doctorSpecialty}
                </p>
              </div>
            </div>

            <StatusBadge status={appointment.status} />
          </div>

          {/* Appointment Details */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem
              icon={<CalendarDays size={16} />}
              label="Date"
              value={formatDate(appointment.dateTime)}
            />

            <DetailItem
              icon={<Clock3 size={16} />}
              label="Time"
              value={formatTime(appointment.dateTime)}
            />

            <DetailItem
              icon={<MessageCircle size={16} />}
              label="Reason"
              value={appointment.reasonForVisit}
            />
          </div>

          {/* Reason / urgency */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Visit priority
            </span>

            <UrgencyBadge urgency={appointment.urgency} />
          </div>

          {/* Existing Rating */}
          {isCompleted && rating && !isRatingOpen && (
            <div className="rounded-2xl border border-[#83B7DE]/30 bg-[#F8FBFF] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Your Rating
                  </p>

                  <div className="mt-2 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={17}
                        className={
                          star <= rating.rating
                            ? "fill-[#F5B942] text-[#F5B942]"
                            : "text-slate-300"
                        }
                      />
                    ))}

                    <span className="ml-2 text-sm font-semibold text-slate-600">
                      {rating.rating}/5
                    </span>
                  </div>

                  {rating.feedback?.trim() && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      “{rating.feedback}”
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onRate}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#83B7DE]/50 bg-white px-4 py-2.5 text-sm font-semibold text-[#3566AB] transition hover:border-[#3566AB] hover:bg-[#F8FBFF]"
                >
                  <Star size={16} />
                  Edit Rating
                </button>
              </div>
            </div>
          )}

          {/* Card Actions */}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={`/patient/consultation/${appointment.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-[#83B7DE] hover:bg-[#F8FBFF] hover:text-[#3566AB]"
            >
              View Consultation
              <ChevronRight size={16} />
            </Link>

            <div className="flex flex-col gap-2 sm:flex-row">
              {isCompleted && (
                <button
                  type="button"
                  onClick={onRate}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#83B7DE]/50 bg-white px-4 py-2.5 text-sm font-semibold text-[#3566AB] transition hover:border-[#3566AB] hover:bg-[#F8FBFF]"
                >
                  <Star
                    size={16}
                    className={rating ? "fill-[#F5B942] text-[#F5B942]" : ""}
                  />
                  {rating ? "Edit Rating" : "Rate Consultation"}
                </button>
              )}

              {appointment.status === "upcoming" && (
                <Link
                  href={`/patient/messages?doctor=${encodeURIComponent(
                    appointment.doctorId,
                  )}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#114084]"
                >
                  <MessageCircle size={16} />
                  Message Doctor
                </Link>
              )}
            </div>
          </div>

          {/* INLINE RATING FORM */}
          {isCompleted && isRatingOpen && (
            <div className="border-t border-slate-200 pt-4">
              {ratingSubmitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-emerald-900">
                        Rating submitted
                      </h3>

                      <p className="mt-1 text-sm leading-relaxed text-emerald-700">
                        Thank you for sharing your feedback about this
                        consultation.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onCloseRating}
                    className="mt-4 w-full rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#83B7DE]/40 bg-[#F8FBFF] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#1C1C1C]">
                        Rate your consultation
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        How was your experience with this practitioner?
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onCloseRating}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
                      aria-label="Close rating"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Stars */}
                  <div className="mt-5">
                    <p className="mb-3 text-sm font-semibold text-slate-700">
                      Your rating
                    </p>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => onRatingChange?.(star)}
                          className="rounded-lg p-1 transition hover:bg-white"
                          aria-label={`Rate ${star} out of 5`}
                        >
                          <Star
                            size={28}
                            className={
                              star <= selectedRating
                                ? "fill-[#F5B942] text-[#F5B942]"
                                : "text-slate-300"
                            }
                          />
                        </button>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {selectedRating === 0
                        ? "Select a rating from 1 to 5 stars."
                        : `${selectedRating} out of 5 stars`}
                    </p>
                  </div>

                  {/* Feedback */}
                  <div className="mt-5">
                    <label
                      htmlFor={`rating-feedback-${appointment.id}`}
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Additional feedback
                      <span className="ml-1 font-normal text-slate-400">
                        (optional)
                      </span>
                    </label>

                    <textarea
                      id={`rating-feedback-${appointment.id}`}
                      value={feedback}
                      onChange={(event) =>
                        onFeedbackChange?.(event.target.value)
                      }
                      maxLength={500}
                      rows={4}
                      placeholder="Tell us about your consultation experience..."
                      className="telecare-input min-h-[100px] resize-none"
                    />

                    <div className="mt-1 text-right text-xs text-slate-400">
                      {feedback.length}/500
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={onCloseRating}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={onSubmitRating}
                      disabled={selectedRating === 0}
                      className="telecare-button rounded-xl px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Submit Rating
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
        <CheckCircle2 size={13} />
        Completed
      </span>
    );
  }

  if (status === "in-progress") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
        <Video size={13} />
        In Progress
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#83B7DE]/15 px-3 py-1.5 text-xs font-semibold text-[#3566AB]">
      <CalendarCheck size={13} />
      Upcoming
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: "low" | "medium" | "high" }) {
  const styles = {
    low: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${styles[urgency]}`}
    >
      {urgency}
    </span>
  );
}

function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="telecare-card flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#83B7DE]/15 text-[#3566AB]">
        {icon}
      </div>

      <h3 className="mt-4 text-base font-bold text-[#1C1C1C]">{title}</h3>

      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
        {description}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
