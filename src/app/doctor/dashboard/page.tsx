"use client";

import Link from "next/link";
import {
  CalendarDays,
  ClipboardList,
  Clock3,
  MessageCircle,
  Users,
  Video,
  ChevronRight,
  Stethoscope,
  MapPin,
  ArrowUpRight,
  CheckCircle2,
  LogOut,
  Activity,
  Star,
  MessageSquareQuote,
  Wallet,
  CreditCard,
} from "lucide-react";

import { useEffect, useMemo } from "react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useRatings } from "@/store/ratings";

export default function DoctorDashboardPage() {
  const { role, userId, logout } = useSession();

  const doctors = useUsers((state) => state.doctors);
  const patients = useUsers((state) => state.patients);

  const { appointments, loadAppointments } = useAppointments();

  const ratings = useRatings((state) => state.ratings);

  useEffect(() => {
    if (role !== "doctor") {
      window.location.href = "/login";
      return;
    }

    if (userId) {
      void loadAppointments();
    }
  }, [role, userId, loadAppointments]);

  const currentDoctor = useMemo(
    () => doctors.find((doctor) => doctor.id === userId),
    [doctors, userId],
  );

  const doctorAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.doctorId === userId)
        .sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        ),
    [appointments, userId],
  );

  const todayAppointments = useMemo(() => {
    const now = new Date();

    return doctorAppointments
      .filter((appointment) => {
        const appointmentDate = new Date(appointment.dateTime);

        return (
          appointment.status === "upcoming" &&
          appointmentDate.getFullYear() === now.getFullYear() &&
          appointmentDate.getMonth() === now.getMonth() &&
          appointmentDate.getDate() === now.getDate()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );
  }, [doctorAppointments]);

  const upcomingAppointments = useMemo(
    () =>
      doctorAppointments
        .filter(
          (appointment) =>
            appointment.status === "upcoming" &&
            new Date(appointment.dateTime).getTime() > Date.now(),
        )
        .sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        ),
    [doctorAppointments],
  );

  const completedAppointments = useMemo(
    () =>
      doctorAppointments
        .filter((appointment) => appointment.status === "completed")
        .sort(
          (a, b) =>
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        ),
    [doctorAppointments],
  );

  const assignedPatientIds = useMemo(
    () =>
      Array.from(
        new Set(
          doctorAppointments
            .map((appointment) => appointment.patientId)
            .filter(Boolean),
        ),
      ),
    [doctorAppointments],
  );

  const assignedPatients = useMemo(
    () => patients.filter((patient) => assignedPatientIds.includes(patient.id)),
    [patients, assignedPatientIds],
  );

  const nextAppointment = upcomingAppointments[0];

  const completionRate =
    doctorAppointments.length > 0
      ? Math.round(
          (completedAppointments.length / doctorAppointments.length) * 100,
        )
      : 0;

  const doctorRatings = useMemo(
    () =>
      ratings
        .filter((rating) => rating.doctorId === userId)
        .sort((a, b) => {
          const appointmentA = appointments.find(
            (appointment) => appointment.id === a.appointmentId,
          );

          const appointmentB = appointments.find(
            (appointment) => appointment.id === b.appointmentId,
          );

          return (
            new Date(appointmentB?.dateTime ?? 0).getTime() -
            new Date(appointmentA?.dateTime ?? 0).getTime()
          );
        }),
    [ratings, appointments, userId],
  );

  const averageRating = useMemo(() => {
    if (doctorRatings.length === 0) {
      return 0;
    }

    const total = doctorRatings.reduce((sum, rating) => sum + rating.rating, 0);

    return total / doctorRatings.length;
  }, [doctorRatings]);

  const ratingDistribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => {
        const count = doctorRatings.filter(
          (rating) => rating.rating === star,
        ).length;

        const percentage =
          doctorRatings.length > 0
            ? Math.round((count / doctorRatings.length) * 100)
            : 0;

        return {
          star,
          count,
          percentage,
        };
      }),
    [doctorRatings],
  );

  const recentRatings = useMemo(
    () => doctorRatings.filter((rating) => rating.feedback?.trim()).slice(0, 3),
    [doctorRatings],
  );

  if (role !== "doctor" || !userId) {
    return null;
  }

  function formatDate(dateTime: string) {
    return new Intl.DateTimeFormat("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateTime));
  }

  function formatTime(dateTime: string) {
    return new Intl.DateTimeFormat("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateTime));
  }

  function getPatientName(patientId: string) {
    return (
      patients.find((patient) => patient.id === patientId)?.name ?? "Patient"
    );
  }

  function getRatingPatientName(appointmentId: string) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    if (!appointment) {
      return "Patient";
    }

    return getPatientName(appointment.patientId);
  }

  function getRatingAppointmentDate(appointmentId: string) {
    const appointment = appointments.find((item) => item.id === appointmentId);

    return appointment ? formatDate(appointment.dateTime) : "Consultation";
  }

  return (
    <main className="page-enter min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium text-[#3566AB]">
              Practitioner Dashboard
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1C] sm:text-3xl">
              Good day, Dr. {currentDoctor?.name?.replace(/^Dr\.?\s*/i, "")}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage consultations, patients, and follow-up care from one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/doctor/messages"
              className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <MessageCircle size={16} />
              Messages
            </Link>

            <button
              type="button"
              onClick={() => {
                logout();
                window.location.href = "/login";
              }}
              className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:border-red-300 hover:bg-red-50"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </section>

        {/* Practitioner Hero */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-[#83B7DE]/40 bg-gradient-to-br from-white via-white to-[#F1F7FC] shadow-sm">
          <div className="flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#3566AB] text-white shadow-sm">
                <Stethoscope size={27} />
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-bold text-[#1C1C1C] sm:text-xl">
                    {currentDoctor?.name ?? "Doctor"}
                  </h2>

                  <span className="rounded-full bg-[#83B7DE]/20 px-2.5 py-1 text-xs font-semibold text-[#3566AB]">
                    Practitioner
                  </span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span>
                    {currentDoctor?.specialty ?? "Healthcare Practitioner"}
                  </span>

                  {currentDoctor?.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={14} />
                      {currentDoctor.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link
              href="/doctor/patients"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#114084]"
            >
              View Patients
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="telecare-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#83B7DE]/20 text-[#3566AB]">
                <Users size={18} />
              </div>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C]">
              {assignedPatients.length}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">Patients</p>
          </div>

          <div className="telecare-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                <CalendarDays size={18} />
              </div>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C]">
              {todayAppointments.length}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Today&apos;s appointments
            </p>
          </div>

          <div className="telecare-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C]">
              {completedAppointments.length}
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Completed consultations
            </p>
          </div>

          <div className="telecare-card rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <ClipboardList size={18} />
              </div>
            </div>

            <p className="text-2xl font-bold text-[#1C1C1C]">
              {completionRate}%
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              Consultation completion
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          {/* Main Column */}
          <div className="space-y-6">
            {/* Next Appointment */}
            <section className="rounded-2xl border border-[#83B7DE]/50 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#3566AB]">
                    Next appointment
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                    Upcoming consultation
                  </h2>
                </div>

                <Clock3 size={20} className="text-[#3566AB]" />
              </div>

              {nextAppointment ? (
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3566AB] text-sm font-bold text-white">
                        {getPatientName(nextAppointment.patientId)
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-bold text-[#1C1C1C]">
                          {getPatientName(nextAppointment.patientId)}
                        </p>

                        <p className="mt-0.5 text-sm text-slate-500">
                          {nextAppointment.reasonForVisit}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right">
                      <p className="font-bold text-[#1C1C1C]">
                        {formatTime(nextAppointment.dateTime)}
                      </p>

                      <p className="text-sm text-slate-500">
                        {formatDate(nextAppointment.dateTime)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/doctor/appointments/${nextAppointment.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#3566AB] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#114084] sm:flex-none"
                    >
                      Open Appointment
                      <ChevronRight size={16} />
                    </Link>

                    <Link
                      href="/doctor/messages"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:flex-none"
                    >
                      <MessageCircle size={16} />
                      Message
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <CalendarDays
                    size={26}
                    className="mx-auto mb-2 text-slate-400"
                  />

                  <p className="font-semibold text-slate-700">
                    No upcoming appointments
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Your next scheduled consultation will appear here.
                  </p>
                </div>
              )}
            </section>

            {/* Today's Schedule */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Today
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                    Today&apos;s schedule
                  </h2>
                </div>

                <Link
                  href="/doctor/appointments"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-[#3566AB] hover:text-[#114084]"
                >
                  View all
                  <ChevronRight size={16} />
                </Link>
              </div>

              {todayAppointments.length > 0 ? (
                <div className="space-y-3">
                  {todayAppointments.slice(0, 5).map((appointment) => {
                    const patient = patients.find(
                      (item) => item.id === appointment.patientId,
                    );

                    return (
                      <Link
                        key={appointment.id}
                        href={`/doctor/appointments/${appointment.id}`}
                        className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                      >
                        <div className="w-16 shrink-0 text-center">
                          <p className="text-sm font-bold text-[#1C1C1C]">
                            {formatTime(appointment.dateTime)}
                          </p>

                          <p className="mt-0.5 text-[11px] text-slate-400">
                            Today
                          </p>
                        </div>

                        <div className="h-9 w-px bg-slate-200" />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#1C1C1C]">
                            {patient?.name ?? "Patient"}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {appointment.reasonForVisit}
                          </p>
                        </div>

                        <span
                          className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${
                            appointment.status === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-blue-50 text-[#3566AB]"
                          }`}
                        >
                          {appointment.status === "completed"
                            ? "Completed"
                            : "Upcoming"}
                        </span>

                        <ChevronRight
                          size={17}
                          className="shrink-0 text-slate-300 transition group-hover:text-[#3566AB]"
                        />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <Clock3 size={24} className="mx-auto mb-2 text-slate-400" />

                  <p className="text-sm font-semibold text-slate-700">
                    No appointments today
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    You have no consultations scheduled for today.
                  </p>
                </div>
              )}
            </section>

            {/* Upcoming Consultations */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Schedule
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                    Upcoming consultations
                  </h2>
                </div>

                <CalendarDays size={20} className="text-[#3566AB]" />
              </div>

              {upcomingAppointments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAppointments.slice(0, 4).map((appointment) => {
                    const patient = patients.find(
                      (item) => item.id === appointment.patientId,
                    );

                    return (
                      <Link
                        key={appointment.id}
                        href={`/doctor/appointments/${appointment.id}`}
                        className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#83B7DE]/15 text-[#3566AB]">
                          <CalendarDays size={18} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-[#1C1C1C]">
                            {patient?.name ?? "Patient"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDate(appointment.dateTime)} ·{" "}
                            {formatTime(appointment.dateTime)}
                          </p>
                        </div>

                        <ChevronRight
                          size={17}
                          className="shrink-0 text-slate-300 transition group-hover:text-[#3566AB]"
                        />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                  <CalendarDays
                    size={24}
                    className="mx-auto mb-2 text-slate-400"
                  />

                  <p className="text-sm font-semibold text-slate-700">
                    No upcoming consultations
                  </p>
                </div>
              )}
            </section>

            {/* Patient Feedback */}
            <section
              id="patient-feedback"
              className="rounded-2xl border border-[#83B7DE]/40 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquareQuote size={19} className="text-[#3566AB]" />

                    <p className="text-xs font-semibold uppercase tracking-wider text-[#3566AB]">
                      Patient Feedback
                    </p>
                  </div>

                  <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                    Ratings & Feedback
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review feedback submitted after your consultations.
                  </p>
                </div>

                {doctorRatings.length > 0 && (
                  <div className="flex items-center gap-3 rounded-2xl bg-[#F8FBFF] px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                      <Star
                        size={20}
                        className="fill-[#F5B942] text-[#F5B942]"
                      />
                    </div>

                    <div>
                      <p className="text-lg font-bold text-[#1C1C1C]">
                        {averageRating.toFixed(1)}
                      </p>

                      <p className="text-xs text-slate-500">
                        {doctorRatings.length}{" "}
                        {doctorRatings.length === 1 ? "rating" : "ratings"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {doctorRatings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                    <Star size={23} />
                  </div>

                  <h3 className="mt-4 text-sm font-bold text-slate-700">
                    No patient ratings yet
                  </h3>

                  <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-500">
                    Ratings and feedback from completed consultations will
                    appear here once patients submit them.
                  </p>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                  {/* Rating Summary */}
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <div className="text-center">
                      <p className="text-4xl font-bold tracking-tight text-[#1C1C1C]">
                        {averageRating.toFixed(1)}
                      </p>

                      <div className="mt-2 flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={18}
                            className={
                              star <= Math.round(averageRating)
                                ? "fill-[#F5B942] text-[#F5B942]"
                                : "text-slate-300"
                            }
                          />
                        ))}
                      </div>

                      <p className="mt-2 text-xs text-slate-500">
                        Based on {doctorRatings.length}{" "}
                        {doctorRatings.length === 1 ? "rating" : "ratings"}
                      </p>
                    </div>

                    <div className="mt-6 space-y-2.5">
                      {ratingDistribution.map((item) => (
                        <div
                          key={item.star}
                          className="flex items-center gap-2"
                        >
                          <span className="w-3 text-xs font-semibold text-slate-500">
                            {item.star}
                          </span>

                          <Star
                            size={13}
                            className="fill-[#F5B942] text-[#F5B942]"
                          />

                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-[#3566AB] transition-all"
                              style={{
                                width: `${item.percentage}%`,
                              }}
                            />
                          </div>

                          <span className="w-8 text-right text-xs font-medium text-slate-400">
                            {item.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Feedback */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-[#1C1C1C]">
                        Recent feedback
                      </h3>

                      <span className="text-xs text-slate-400">
                        Latest submissions
                      </span>
                    </div>

                    {recentRatings.length > 0 ? (
                      <div className="space-y-3">
                        {recentRatings.map((rating) => (
                          <div
                            key={rating.id ?? rating.appointmentId}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-[#1C1C1C]">
                                  {getRatingPatientName(rating.appointmentId)}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  Consultation ·{" "}
                                  {getRatingAppointmentDate(
                                    rating.appointmentId,
                                  )}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={13}
                                    className={
                                      star <= rating.rating
                                        ? "fill-[#F5B942] text-[#F5B942]"
                                        : "text-slate-300"
                                    }
                                  />
                                ))}
                              </div>
                            </div>

                            <p className="mt-3 text-sm leading-relaxed text-slate-600">
                              “{rating.feedback}”
                            </p>

                            <div className="mt-3">
                              <Link
                                href={`/doctor/appointments/${rating.appointmentId}`}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-[#3566AB] hover:text-[#114084]"
                              >
                                View consultation
                                <ChevronRight size={13} />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                        <MessageCircle
                          size={22}
                          className="mx-auto mb-2 text-slate-400"
                        />

                        <p className="text-sm font-semibold text-slate-700">
                          Ratings received
                        </p>

                        <p className="mt-1 text-xs leading-relaxed text-slate-500">
                          Patients have submitted ratings, but none include
                          written feedback yet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Quick Actions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Workspace
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                  Quick actions
                </h2>
              </div>

              <div className="space-y-2">
                {/* Patient Management */}
                <Link
                  href="/doctor/patients"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                    <Users size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1C1C1C]">
                      Patient Management
                    </p>

                    <p className="text-xs text-slate-500">
                      View patient records
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 group-hover:text-[#3566AB]"
                  />
                </Link>

                {/* Earnings */}
                <Link
                  href="/doctor/earnings"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Wallet size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1C1C1C]">Earnings</p>

                    <p className="text-xs text-slate-500">
                      View revenue and practitioner payouts
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 group-hover:text-emerald-600"
                  />
                </Link>

                {/* Subscription */}
                <Link
                  href="/doctor/subscription"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#3566AB]">
                    <CreditCard size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1C1C1C]">
                      Subscription
                    </p>

                    <p className="text-xs text-slate-500">
                      Manage your practitioner plan
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 group-hover:text-[#3566AB]"
                  />
                </Link>

                {/* Health Metrics / Trends */}
                <Link
                  href="/doctor/patients"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Activity size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1C1C1C]">
                      Health Metrics
                    </p>

                    <p className="text-xs text-slate-500">
                      Review patient vitals and trends
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 group-hover:text-emerald-600"
                  />
                </Link>

                {/* Ratings */}
                <a
                  href="#patient-feedback"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <Star
                      size={18}
                      className={
                        doctorRatings.length > 0
                          ? "fill-[#F5B942] text-[#F5B942]"
                          : ""
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1C1C1C]">
                      Ratings & Feedback
                    </p>

                    <p className="text-xs text-slate-500">
                      {doctorRatings.length > 0
                        ? `${averageRating.toFixed(1)} average rating`
                        : "View patient feedback"}
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 group-hover:text-amber-600"
                  />
                </a>

                {/* Messages */}
                <Link
                  href="/doctor/messages"
                  className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <MessageCircle size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1C1C1C]">Messages</p>

                    <p className="text-xs text-slate-500">
                      Communicate with patients
                    </p>
                  </div>

                  <ChevronRight
                    size={17}
                    className="text-slate-300 group-hover:text-violet-600"
                  />
                </Link>

                {/* Start Consultation */}
                {nextAppointment && (
                  <Link
                    href={`/doctor/appointments/${nextAppointment.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-[#83B7DE]/50 hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Video size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#1C1C1C]">
                        Start Consultation
                      </p>

                      <p className="text-xs text-slate-500">
                        Open your next appointment
                      </p>
                    </div>

                    <ChevronRight
                      size={17}
                      className="text-slate-300 group-hover:text-amber-600"
                    />
                  </Link>
                )}
              </div>
            </section>

            {/* Practice Snapshot */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Practice
                </p>

                <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                  Practice snapshot
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      Completed consultations
                    </span>

                    <span className="text-sm font-bold text-[#1C1C1C]">
                      {completedAppointments.length}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#3566AB]"
                      style={{
                        width: `${Math.min(completionRate, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      Upcoming consultations
                    </span>

                    <span className="text-sm font-bold text-[#1C1C1C]">
                      {upcomingAppointments.length}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#83B7DE]"
                      style={{
                        width: `${Math.min(
                          upcomingAppointments.length * 20,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-[#3566AB]" />

                    <span className="text-sm text-slate-600">
                      Connected patients
                    </span>
                  </div>

                  <span className="font-bold text-[#1C1C1C]">
                    {assignedPatients.length}
                  </span>
                </div>
              </div>
            </section>

            {/* Recent Completed */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Recent
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-[#1C1C1C]">
                    Completed consultations
                  </h2>
                </div>

                <ClipboardList size={19} className="text-[#3566AB]" />
              </div>

              {completedAppointments.length > 0 ? (
                <div className="space-y-2">
                  {completedAppointments.slice(0, 4).map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/doctor/appointments/${appointment.id}`}
                      className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-slate-50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={17} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#1C1C1C]">
                          {getPatientName(appointment.patientId)}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {formatDate(appointment.dateTime)}
                        </p>
                      </div>

                      <ChevronRight
                        size={16}
                        className="shrink-0 text-slate-300 group-hover:text-[#3566AB]"
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">
                  No completed consultations yet.
                </p>
              )}
            </section>
          </aside>
        </div>

        {/* Prototype Notice */}
        <section className="mt-6 rounded-2xl border border-[#83B7DE]/40 bg-[#83B7DE]/10 p-4">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <Stethoscope size={18} className="text-[#3566AB]" />
            </div>

            <div>
              <p className="text-sm font-bold text-[#1C1C1C]">
                TeleCare practitioner workspace
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                This dashboard is part of the TeleCare prototype. Patient
                records, consultations, messaging, prescriptions, ratings, and
                health metrics are presented through the current application
                data layer.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
