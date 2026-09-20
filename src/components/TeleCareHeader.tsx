"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  HeartPulse,
  LogOut,
  Menu,
  MessageCircle,
  Pill,
  Stethoscope,
  User,
  Users,
  X,
  ClipboardCheck,
  Clock3,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useSession } from "@/store/session";
import { useAppointments } from "@/store/appointments";
import { usePrescriptions } from "@/store/prescriptions";
import { useReminders } from "@/store/reminders";
import { useMedicationLogs } from "@/store/medicationLogs";

type PortalRole = "patient" | "doctor";

interface TeleCareHeaderProps {
  role: PortalRole;
  userName?: string;
  userSubtitle?: string;
}

interface NotificationItem {
  id: string;
  type: "medication" | "appointment" | "follow-up" | "refill";
  title: string;
  message: string;
  date: Date;
  href: string;
}

export default function TeleCareHeader({
  role,
  userName = role === "patient" ? "Patient" : "Doctor",
  userSubtitle,
}: TeleCareHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { userId } = useSession();
  const { appointments } = useAppointments();
  const { prescriptions } = usePrescriptions();
  const { reminders } = useReminders();
  const { medicationLogs } = useMedicationLogs();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const patientLinks = [
    {
      label: "Dashboard",
      href: "/patient/dashboard",
      icon: HeartPulse,
    },
    {
      label: "Appointments",
      href: "/patient/appointments",
      icon: CalendarDays,
    },
    {
      label: "Messages",
      href: "/patient/messages",
      icon: MessageCircle,
    },
    {
      label: "Medications",
      href: "/patient/medications",
      icon: Pill,
    },
    {
      label: "Records",
      href: "/patient/records",
      icon: FileText,
    },
  ];

  const doctorLinks = [
    {
      label: "Dashboard",
      href: "/doctor/dashboard",
      icon: Stethoscope,
    },
    {
      label: "Appointments",
      href: "/doctor/appointments",
      icon: CalendarDays,
    },
    {
      label: "Messages",
      href: "/doctor/messages",
      icon: MessageCircle,
    },
    {
      label: "Patients",
      href: "/doctor/patients",
      icon: Users,
    },
  ];

  const links = role === "patient" ? patientLinks : doctorLinks;

  const isActive = (href: string) => {
    if (href === `/${role}/dashboard`) {
      return pathname === href;
    }

    return pathname.startsWith(href);
  };

  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (Math.abs(diff) < 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    if (date.toDateString() === now.toDateString()) {
      return `Today · ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow · ${date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const notifications = useMemo<NotificationItem[]>(() => {
    if (role !== "patient" || !userId) {
      return [];
    }

    const now = new Date();
    const items: NotificationItem[] = [];

    /*
     * Upcoming appointments
     */
    appointments
      .filter(
        (appointment) =>
          appointment.patientId === userId && appointment.status === "upcoming",
      )
      .forEach((appointment) => {
        const appointmentDate = new Date(appointment.dateTime);

        if (Number.isNaN(appointmentDate.getTime())) {
          return;
        }

        if (appointmentDate >= now) {
          items.push({
            id: `appointment-${appointment.id}`,
            type: "appointment",
            title: "Upcoming appointment",
            message: `Your check-up is scheduled for ${formatNotificationDate(
              appointmentDate,
            )}.`,
            date: appointmentDate,
            href: "/patient/appointments",
          });
        }
      });

    /*
     * Active follow-up / appointment reminders
     */
    reminders
      .filter(
        (reminder) => reminder.patientId === userId && !reminder.completed,
      )
      .forEach((reminder) => {
        const dueDate = new Date(reminder.dueDate);

        if (Number.isNaN(dueDate.getTime())) {
          return;
        }

        if (reminder.type === "follow-up") {
          items.push({
            id: `follow-up-${reminder.id}`,
            type: "follow-up",
            title: reminder.title || "Follow-up reminder",
            message: reminder.message,
            date: dueDate,
            href: "/patient/appointments",
          });
        }
      });

    /*
     * Medication / prescription reminders
     *
     * nextDose is used as the primary medication reminder.
     * A dose that has already been logged as taken is not shown.
     */
    prescriptions
      .filter((prescription) => prescription.patientId === userId)
      .forEach((prescription) => {
        const nextDose = new Date(prescription.nextDose);

        if (!Number.isNaN(nextDose.getTime())) {
          const doseTaken = medicationLogs.some(
            (log) =>
              log.prescriptionId === prescription.id &&
              log.scheduledFor === prescription.nextDose &&
              Boolean(log.takenAt),
          );

          if (!doseTaken) {
            items.push({
              id: `medication-${prescription.id}`,
              type: "medication",
              title: "Medication reminder",
              message: `${prescription.medication} · ${prescription.dosage} · ${prescription.schedule}`,
              date: nextDose,
              href: "/patient/medications",
            });
          }
        }

        /*
         * Refill reminder
         */
        if (prescription.refillRemindAt) {
          const refillDate = new Date(prescription.refillRemindAt);

          if (!Number.isNaN(refillDate.getTime())) {
            items.push({
              id: `refill-${prescription.id}`,
              type: "refill",
              title: "Medication refill reminder",
              message: `${prescription.medication} may need a refill.`,
              date: refillDate,
              href: "/patient/medications",
            });
          }
        }
      });

    return items
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 8);
  }, [role, userId, appointments, reminders, prescriptions, medicationLogs]);

  const handleNotificationClick = (notification: NotificationItem) => {
    setNotificationsOpen(false);
    router.push(notification.href);
  };

  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "medication":
        return <Pill className="h-4 w-4" strokeWidth={2} />;

      case "appointment":
        return <CalendarDays className="h-4 w-4" strokeWidth={2} />;

      case "follow-up":
        return <ClipboardCheck className="h-4 w-4" strokeWidth={2} />;

      case "refill":
        return <RefreshCw className="h-4 w-4" strokeWidth={2} />;

      default:
        return <Bell className="h-4 w-4" strokeWidth={2} />;
    }
  };

  const getNotificationIconClass = (type: NotificationItem["type"]) => {
    switch (type) {
      case "medication":
        return "bg-blue-50 text-[#3566AB]";

      case "appointment":
        return "bg-indigo-50 text-indigo-600";

      case "follow-up":
        return "bg-emerald-50 text-emerald-600";

      case "refill":
        return "bg-amber-50 text-amber-600";

      default:
        return "bg-slate-50 text-slate-600";
    }
  };

  const handleLogout = () => {
    /*
     * Keep this intentionally lightweight for now.
     * Your existing session/auth implementation can be wired here
     * without changing the visual header.
     */
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-[68px] items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href={`/${role}/dashboard`}
            className="group flex shrink-0 items-center gap-2.5"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3566AB] to-[#114084] text-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
              <HeartPulse className="h-5 w-5" strokeWidth={2.3} />
            </div>

            <div className="leading-none">
              <div className="text-[17px] font-bold tracking-tight text-slate-900">
                Tele<span className="text-[#3566AB]">Care</span>
              </div>

              <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Digital Healthcare
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={[
                    "telecare-button relative flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium",
                    active
                      ? "bg-blue-50 text-[#3566AB]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" strokeWidth={active ? 2.2 : 1.9} />

                  <span>{link.label}</span>

                  {active && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-[#3566AB]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {role === "patient" && (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={() => setNotificationsOpen((value) => !value)}
                  className="telecare-button relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <Bell className="h-[18px] w-[18px]" strokeWidth={1.9} />

                  {notifications.length > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#3566AB]" />
                  )}
                </button>

                {notificationsOpen && (
                  <div className="modal-enter absolute right-0 top-[calc(100%+10px)] z-50 w-[340px] max-w-[calc(100vw-32px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Notifications
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {notifications.length > 0
                            ? `${notifications.length} active ${
                                notifications.length === 1
                                  ? "notification"
                                  : "notifications"
                              }`
                            : "You're all caught up"}
                        </p>
                      </div>

                      <Bell
                        className="h-4 w-4 text-slate-300"
                        strokeWidth={1.8}
                      />
                    </div>

                    {notifications.length > 0 ? (
                      <div className="max-h-[420px] overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            type="button"
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                            className="flex w-full gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition hover:bg-slate-50"
                          >
                            <div
                              className={[
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                getNotificationIconClass(notification.type),
                              ].join(" ")}
                            >
                              {getNotificationIcon(notification.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-semibold text-slate-800">
                                  {notification.title}
                                </p>

                                <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                              </div>

                              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                                {notification.message}
                              </p>

                              <p className="mt-1.5 text-[10px] font-medium text-slate-400">
                                {formatNotificationDate(notification.date)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-8 text-center">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-50">
                          <Bell
                            className="h-5 w-5 text-slate-300"
                            strokeWidth={1.7}
                          />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No notifications
                        </p>

                        <p className="mx-auto mt-1 max-w-[220px] text-[11px] leading-relaxed text-slate-400">
                          New appointment, medication, and follow-up reminders
                          will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />

            {/* Profile */}
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="telecare-button flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50"
              >
                <div
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                    role === "patient"
                      ? "bg-blue-100 text-[#3566AB]"
                      : "bg-slate-900 text-white",
                  ].join(" ")}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>

                <div className="hidden text-left md:block">
                  <p className="max-w-[130px] truncate text-xs font-semibold text-slate-800">
                    {userName}
                  </p>

                  <p className="max-w-[130px] truncate text-[10px] text-slate-400">
                    {userSubtitle ||
                      (role === "patient"
                        ? "Patient Portal"
                        : "Practitioner Portal")}
                  </p>
                </div>

                <ChevronDown
                  className={[
                    "hidden h-4 w-4 text-slate-400 transition-transform md:block",
                    profileOpen ? "rotate-180" : "",
                  ].join(" ")}
                />
              </button>

              {profileOpen && (
                <div className="modal-enter absolute right-0 top-[calc(100%+8px)] w-52 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {userName}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {userSubtitle ||
                        (role === "patient"
                          ? "Patient Portal"
                          : "Practitioner Portal")}
                    </p>
                  </div>

                  <Link
                    href={
                      role === "patient"
                        ? "/patient/dashboard"
                        : "/doctor/dashboard"
                    }
                    onClick={() => setProfileOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <User className="h-4 w-4" />
                    My Dashboard
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen((value) => !value)}
              className="telecare-button flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileOpen && (
          <div className="fade-up border-t border-slate-100 py-3 lg:hidden">
            <nav className="grid gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                      active
                        ? "bg-blue-50 text-[#3566AB]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}

                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-[#3566AB]" />
                    )}
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
