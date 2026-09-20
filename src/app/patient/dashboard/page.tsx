"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarCheck,
  Pill,
  FileText,
  MessageSquare,
  ArrowRight,
  Clock3,
  Plus,
  Activity,
  CheckCircle2,
  Stethoscope,
  ClipboardCheck,
  MapPin,
  type LucideIcon,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { usePrescriptions } from "@/store/prescriptions";
import { useReminders } from "@/store/reminders";

export default function PatientDashboard() {
  const router = useRouter();
  const { role, userId } = useSession();

  const patients = useUsers((s) => s.patients);
  const doctors = useUsers((s) => s.doctors);
  const loadDoctors = useUsers((s) => s.loadDoctors);

  const appointments = useAppointments((s) => s.appointments);
  const loadAppointments = useAppointments((s) => s.loadAppointments);

  const prescriptions = usePrescriptions((s) => s.prescriptions);
  const loadPrescriptions = usePrescriptions((s) => s.loadPrescriptions);

  const reminders = useReminders((s) => s.reminders);
  const loadReminders = useReminders((s) => s.loadReminders);

  useEffect(() => {
    if (role !== "patient" || !userId) {
      router.replace("/login");
      return;
    }

    const loadDashboardData = async () => {
      await Promise.all([
        loadAppointments(),
        loadPrescriptions(),
        loadReminders(),
        loadDoctors(),
      ]);
    };

    loadDashboardData();
  }, [
    role,
    userId,
    router,
    loadAppointments,
    loadPrescriptions,
    loadReminders,
    loadDoctors,
  ]);

  const patient = useMemo(
    () => patients.find((p) => p.id === userId),
    [patients, userId],
  );

  const myAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.patientId === userId)
        .sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        ),
    [appointments, userId],
  );

  const upcomingAppointments = useMemo(
    () =>
      myAppointments.filter((appointment) => appointment.status === "upcoming"),
    [myAppointments],
  );

  const nextAppointment = upcomingAppointments[0];

  const nextDoctor = nextAppointment
    ? doctors.find((doctor) => doctor.id === nextAppointment.doctorId)
    : undefined;

  const completedAppointments = useMemo(
    () =>
      myAppointments.filter(
        (appointment) => appointment.status === "completed",
      ),
    [myAppointments],
  );

  const myPrescriptions = useMemo(
    () =>
      prescriptions.filter((prescription) => prescription.patientId === userId),
    [prescriptions, userId],
  );

  const followUpReminders = useMemo(
    () =>
      reminders
        .filter(
          (reminder) =>
            reminder.patientId === userId &&
            reminder.type === "follow-up" &&
            !reminder.completed,
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
        ),
    [reminders, userId],
  );

  const nextFollowUp = followUpReminders[0];

  const followUpDoctor = nextFollowUp?.doctorId
    ? doctors.find((doctor) => doctor.id === nextFollowUp.doctorId)
    : undefined;

  const recentAppointments = useMemo(
    () =>
      completedAppointments
        .slice()
        .sort(
          (a, b) =>
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        )
        .slice(0, 3),
    [completedAppointments],
  );

  if (role !== "patient" || !userId || !patient) {
    return null;
  }

  const firstName = patient.name.split(" ")[0];

  const formattedAppointmentDate = nextAppointment
    ? new Date(nextAppointment.dateTime).toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedAppointmentTime = nextAppointment
    ? new Date(nextAppointment.dateTime).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const formattedFollowUpDate = nextFollowUp
    ? new Date(nextFollowUp.dueDate).toLocaleDateString([], {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  const formattedFollowUpTime = nextFollowUp
    ? new Date(nextFollowUp.dueDate).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="page-enter">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="fade-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-brand">
                Patient Portal
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Good day, {firstName} 👋
              </h1>

              <p className="mt-1.5 max-w-xl text-sm text-slate-500 sm:text-base">
                Here&apos;s an overview of your appointments, medications, and
                recent care.
              </p>
            </div>

            <Link
              href="/patient/book"
              className="telecare-button inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"
            >
              <Plus size={17} />
              Book Consultation
            </Link>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <div className="telecare-card overflow-hidden fade-up fade-up-delay-1">
            <div className="bg-gradient-to-br from-brand-dark to-brand p-6 text-white sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-50 backdrop-blur-sm">
                    <CalendarCheck size={14} />
                    Upcoming appointment
                  </div>

                  {nextAppointment ? (
                    <>
                      <h2 className="text-xl font-bold sm:text-2xl">
                        {nextDoctor?.name ?? "Doctor"}
                      </h2>

                      <p className="mt-1 text-sm text-blue-100">
                        {nextDoctor?.specialty ?? "Medical consultation"}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold sm:text-2xl">
                        No upcoming appointments
                      </h2>

                      <p className="mt-1 text-sm text-blue-100">
                        Schedule a consultation whenever you need one.
                      </p>
                    </>
                  )}
                </div>

                <div className="hidden rounded-2xl bg-white/10 p-3 backdrop-blur-sm sm:block">
                  <Stethoscope size={25} />
                </div>
              </div>

              {nextAppointment && (
                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                      <CalendarCheck size={15} />
                      Date
                    </div>

                    <p className="mt-1.5 text-sm font-semibold">
                      {formattedAppointmentDate}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-100">
                      <Clock3 size={15} />
                      Time
                    </div>

                    <p className="mt-1.5 text-sm font-semibold">
                      {formattedAppointmentTime}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              {nextAppointment ? (
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Reason for visit
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-slate-700">
                    {nextAppointment.reasonForVisit}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Your upcoming consultations will appear here.
                </p>
              )}

              <div className="flex shrink-0 gap-2">
                {nextAppointment && (
                  <Link
                    href="/patient/appointments"
                    className="telecare-button inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:border-brand-light hover:text-brand-dark"
                  >
                    View
                    <ArrowRight size={15} />
                  </Link>
                )}

                <Link
                  href="/patient/book"
                  className="telecare-button inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  {nextAppointment ? "Book another" : "Book now"}
                </Link>
              </div>
            </div>
          </div>

          <div className="telecare-card fade-up fade-up-delay-2 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Care overview
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Your current TeleCare activity
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-2.5 text-brand">
                <Activity size={20} />
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <CalendarCheck size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Upcoming visits
                    </p>

                    <p className="text-xs text-slate-500">
                      Scheduled consultations
                    </p>
                  </div>
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {upcomingAppointments.length}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                    <Pill size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Active medications
                    </p>

                    <p className="text-xs text-slate-500">
                      Current prescriptions
                    </p>
                  </div>
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {myPrescriptions.length}
                </span>
              </div>

              <div className="h-px bg-slate-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
                    <CheckCircle2 size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Completed consultations
                    </p>

                    <p className="text-xs text-slate-500">Your care history</p>
                  </div>
                </div>

                <span className="text-lg font-bold text-slate-900">
                  {completedAppointments.length}
                </span>
              </div>
            </div>

            <Link
              href="/patient/records"
              className="telecare-button mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-light hover:text-brand-dark"
            >
              View health records
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        {nextFollowUp && (
          <section className="mt-5 fade-up fade-up-delay-2">
            <div className="telecare-card overflow-hidden">
              <div className="border-b border-slate-100 bg-blue-50/60 px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                    <ClipboardCheck size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        Recommended Follow-up
                      </h2>

                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        Doctor recommended
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Your doctor has recommended another consultation based on
                      your recent care.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <Stethoscope size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {followUpDoctor?.name ?? "Your Doctor"}
                        </p>

                        {followUpDoctor?.specialty && (
                          <p className="truncate text-xs text-slate-500">
                            {followUpDoctor.specialty}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <CalendarCheck size={14} />
                          Suggested date
                        </div>

                        <p className="mt-1.5 text-sm font-semibold text-slate-800">
                          {formattedFollowUpDate}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                          <Clock3 size={14} />
                          Suggested time
                        </div>

                        <p className="mt-1.5 text-sm font-semibold text-slate-800">
                          {formattedFollowUpTime}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Follow-up details
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-slate-700">
                        {nextFollowUp.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 md:w-44">
                    <Link
                      href={`/patient/book?followUp=${encodeURIComponent(
                        nextFollowUp.id,
                      )}`}
                      className="telecare-button inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                      Book Follow-up
                      <ArrowRight size={15} />
                    </Link>

                    <Link
                      href="/patient/appointments"
                      className="telecare-button inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-light hover:text-brand-dark"
                    >
                      View details
                    </Link>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 px-3.5 py-3">
                  <p className="text-xs leading-5 text-slate-500">
                    This is a recommended follow-up, not a booked appointment.
                    Use the booking flow above to schedule your consultation.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7 fade-up fade-up-delay-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quick actions
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Access your most-used TeleCare features.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <QuickAction
              href="/patient/book"
              icon={CalendarCheck}
              title="Book"
              subtitle="Consultation"
            />

            <QuickAction
              href="/patient/medications"
              icon={Pill}
              title="Medications"
              subtitle="Track doses"
            />

            <QuickAction
              href="/patient/records"
              icon={FileText}
              title="Records"
              subtitle="Health history"
            />

            <QuickAction
              href="/patient/health"
              icon={Activity}
              title="Health"
              subtitle="Metrics & trends"
            />

            <QuickAction
              href="/patient/messages"
              icon={MessageSquare}
              title="Messages"
              subtitle="Chat with doctor"
            />

            <QuickAction
              href="/patient/nearby-care"
              icon={MapPin}
              title="Nearby Care"
              subtitle="Clinics & hospitals"
            />
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.5fr_1fr] fade-up fade-up-delay-3">
          <div className="telecare-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recent care
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Your latest completed consultations
                </p>
              </div>

              <Link
                href="/patient/records"
                className="text-xs font-semibold text-brand hover:text-brand-dark"
              >
                View all
              </Link>
            </div>

            {recentAppointments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentAppointments.map((appointment) => {
                  const doctor = doctors.find(
                    (item) => item.id === appointment.doctorId,
                  );

                  return (
                    <div
                      key={appointment.id}
                      className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand">
                          <Stethoscope size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {doctor?.name ?? "Doctor"}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {appointment.reasonForVisit}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:shrink-0">
                        <span className="text-xs text-slate-400">
                          {new Date(appointment.dateTime).toLocaleDateString(
                            [],
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>

                        <Link
                          href={`/patient/consultation/${appointment.id}`}
                          className="telecare-button inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-brand"
                        >
                          View
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <FileText size={20} />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No completed consultations yet
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                  Completed consultations and clinical notes will appear here.
                </p>
              </div>
            )}
          </div>

          <div className="telecare-card flex flex-col justify-between overflow-hidden">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <MessageSquare size={21} />
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Stay connected with your doctor
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Have a question about your appointment or care plan? Send your
                doctor a message through TeleCare.
              </p>
            </div>

            <div className="p-5">
              <Link
                href="/patient/messages"
                className="telecare-button flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Open messages
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="telecare-card-hover group flex items-center gap-3 p-4"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand transition-colors group-hover:bg-brand group-hover:text-white">
        <Icon size={19} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800">{title}</p>

        <p className="truncate text-xs text-slate-500">{subtitle}</p>
      </div>
    </Link>
  );
}
