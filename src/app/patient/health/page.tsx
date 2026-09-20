"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Stethoscope,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useClinicalNotes } from "@/store/clinicalNotes";
import { doctors } from "@/lib/mock-data/doctors";
import { Appointment } from "@/lib/types";

interface HealthRecord {
  appointment: Appointment;
  doctorName: string;
  doctorSpecialty?: string;
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  diagnosis: string;
  treatmentPlan: string;
  doctorNotes?: string;
  date: Date;
}

interface MetricPoint {
  date: Date;
  label: string;
  value: number;
}

interface BloodPressurePoint {
  date: Date;
  label: string;
  systolic: number;
  diastolic: number;
}

export default function PatientHealthPage() {
  const router = useRouter();
  const { role, userId } = useSession();

  const patients = useUsers((state) => state.patients);
  const appointments = useAppointments((state) => state.appointments);
  const clinicalNotes = useClinicalNotes((state) => state.clinicalNotes);

  useEffect(() => {
    if (role !== "patient" || !userId) {
      router.replace("/login");
    }
  }, [role, userId, router]);

  const patient = useMemo(
    () => patients.find((item) => item.id === userId),
    [patients, userId],
  );

  const healthRecords = useMemo<HealthRecord[]>(() => {
    if (!userId) {
      return [];
    }

    const records: HealthRecord[] = [];

    appointments
      .filter(
        (appointment) =>
          appointment.patientId === userId &&
          appointment.status === "completed",
      )
      .forEach((appointment) => {
        const note = clinicalNotes.find(
          (item) => item.appointmentId === appointment.id,
        );

        if (!note) {
          return;
        }

        const doctor = doctors.find((item) => item.id === appointment.doctorId);

        records.push({
          appointment,
          doctorName: doctor?.name ?? "Doctor",
          ...(doctor?.specialty ? { doctorSpecialty: doctor.specialty } : {}),
          bloodPressure: note.vitals.bloodPressure,
          heartRate: note.vitals.heartRate,
          temperature: note.vitals.temperature,
          diagnosis: note.diagnosis,
          treatmentPlan: note.treatmentPlan,
          ...(note.doctorNotes ? { doctorNotes: note.doctorNotes } : {}),
          date: new Date(appointment.dateTime),
        });
      });

    return records.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appointments, clinicalNotes, userId]);

  const latestRecord = healthRecords[0];

  const healthHistory = useMemo(
    () => healthRecords.slice().reverse(),
    [healthRecords],
  );

  const heartRatePoints = useMemo<MetricPoint[]>(
    () =>
      healthHistory.map((record) => ({
        date: record.date,
        label: formatShortDate(record.date),
        value: record.heartRate,
      })),
    [healthHistory],
  );

  const temperaturePoints = useMemo<MetricPoint[]>(
    () =>
      healthHistory.map((record) => ({
        date: record.date,
        label: formatShortDate(record.date),
        value: record.temperature,
      })),
    [healthHistory],
  );

  const bloodPressurePoints = useMemo<BloodPressurePoint[]>(() => {
    const points: BloodPressurePoint[] = [];

    healthHistory.forEach((record) => {
      const parsed = parseBloodPressure(record.bloodPressure);

      if (!parsed) {
        return;
      }

      points.push({
        date: record.date,
        label: formatShortDate(record.date),
        systolic: parsed.systolic,
        diastolic: parsed.diastolic,
      });
    });

    return points;
  }, [healthHistory]);

  if (role !== "patient" || !userId || !patient) {
    return null;
  }

  return (
    <main className="page-enter">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="fade-up">
          <Link
            href="/patient/dashboard"
            className="telecare-button mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:border-brand-light hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Dashboard
          </Link>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-brand">
                Health Overview
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Your Health Metrics
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                Review your recorded vital signs and clinical history from
                completed TeleCare consultations.
              </p>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-brand">
              <Activity size={16} />
              {healthRecords.length} recorded{" "}
              {healthRecords.length === 1 ? "consultation" : "consultations"}
            </div>
          </div>
        </section>

        {latestRecord ? (
          <>
            <section className="mt-7 fade-up fade-up-delay-1">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Latest health snapshot
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Most recent vitals recorded during your consultation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                  icon={HeartPulse}
                  label="Blood pressure"
                  value={latestRecord.bloodPressure}
                  unit="mmHg"
                  description={`Recorded ${formatFullDate(latestRecord.date)}`}
                  iconClass="bg-rose-50 text-rose-600"
                />

                <MetricCard
                  icon={Activity}
                  label="Heart rate"
                  value={String(latestRecord.heartRate)}
                  unit="bpm"
                  description={`Recorded ${formatFullDate(latestRecord.date)}`}
                  iconClass="bg-blue-50 text-brand"
                />

                <MetricCard
                  icon={Thermometer}
                  label="Temperature"
                  value={latestRecord.temperature.toFixed(1)}
                  unit="°C"
                  description={`Recorded ${formatFullDate(latestRecord.date)}`}
                  iconClass="bg-amber-50 text-amber-600"
                />

                <MetricCard
                  icon={CalendarDays}
                  label="Last consultation"
                  value={formatMetricDate(latestRecord.date)}
                  description={latestRecord.doctorName}
                  iconClass="bg-emerald-50 text-emerald-600"
                  compact
                />
              </div>
            </section>

            <section className="mt-7 fade-up fade-up-delay-2">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-slate-900">
                  Health trends
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  Historical vital signs recorded during your consultations.
                </p>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <TrendCard
                  title="Blood pressure"
                  subtitle="Systolic / diastolic"
                  icon={HeartPulse}
                  iconClass="bg-rose-50 text-rose-600"
                >
                  <BloodPressureChart points={bloodPressurePoints} />
                </TrendCard>

                <TrendCard
                  title="Heart rate"
                  subtitle="Beats per minute"
                  icon={Activity}
                  iconClass="bg-blue-50 text-brand"
                >
                  <MetricChart
                    points={heartRatePoints}
                    unit="bpm"
                    emptyLabel="No heart-rate trend available"
                  />
                </TrendCard>

                <TrendCard
                  title="Temperature"
                  subtitle="Degrees Celsius"
                  icon={Thermometer}
                  iconClass="bg-amber-50 text-amber-600"
                >
                  <MetricChart
                    points={temperaturePoints}
                    unit="°C"
                    decimals={1}
                    emptyLabel="No temperature trend available"
                  />
                </TrendCard>

                <div className="telecare-card overflow-hidden">
                  <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        <ClipboardList size={19} />
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Latest clinical assessment
                        </h3>

                        <p className="mt-0.5 text-xs text-slate-500">
                          From your most recent completed consultation
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Diagnosis
                      </p>

                      <p className="mt-1.5 text-sm font-semibold leading-6 text-slate-800">
                        {latestRecord.diagnosis}
                      </p>
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Treatment plan
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-slate-600">
                        {latestRecord.treatmentPlan}
                      </p>
                    </div>

                    {latestRecord.doctorNotes?.trim() && (
                      <>
                        <div className="h-px bg-slate-100" />

                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                            Doctor&apos;s notes
                          </p>

                          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {latestRecord.doctorNotes}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-7 fade-up fade-up-delay-3">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Clinical history
                  </h2>

                  <p className="mt-0.5 text-sm text-slate-500">
                    Your completed consultations and recorded findings.
                  </p>
                </div>

                <Link
                  href="/patient/records"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-dark"
                >
                  View full records
                  <ArrowRight size={14} />
                </Link>
              </div>

              <div className="space-y-4">
                {healthRecords.map((record, index) => (
                  <ClinicalHistoryCard
                    key={record.appointment.id}
                    record={record}
                    isLatest={index === 0}
                  />
                ))}
              </div>
            </section>
          </>
        ) : (
          <EmptyHealthState />
        )}
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  description,
  iconClass,
  compact = false,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  unit?: string;
  description: string;
  iconClass: string;
  compact?: boolean;
}) {
  return (
    <div className="telecare-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={
                compact
                  ? "text-xl font-bold text-slate-900"
                  : "text-2xl font-bold text-slate-900"
              }
            >
              {value}
            </span>

            {unit && (
              <span className="text-xs font-medium text-slate-400">{unit}</span>
            )}
          </div>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function TrendCard({
  title,
  subtitle,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconClass: string;
  children: React.ReactNode;
}) {
  return (
    <div className="telecare-card overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>

          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

function MetricChart({
  points,
  unit,
  decimals = 0,
  emptyLabel,
}: {
  points: MetricPoint[];
  unit: string;
  decimals?: number;
  emptyLabel: string;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl bg-slate-50">
        <p className="text-xs text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const paddingLeft = 48;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 42;

  const values = points.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  const range = Math.max(maxValue - minValue, decimals > 0 ? 0.5 : 5);
  const chartMin = minValue - range * 0.2;
  const chartMax = maxValue + range * 0.2;

  const getX = (index: number) => {
    if (points.length === 1) {
      return width / 2;
    }

    return (
      paddingLeft +
      (index / (points.length - 1)) * (width - paddingLeft - paddingRight)
    );
  };

  const getY = (value: number) =>
    paddingTop +
    ((chartMax - value) / (chartMax - chartMin)) *
      (height - paddingTop - paddingBottom);

  const linePoints = points
    .map((point, index) => `${getX(index)},${getY(point.value)}`)
    .join(" ");

  const gridValues = [0, 1, 2, 3].map(
    (index) => chartMax - (index / 3) * (chartMax - chartMin),
  );

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-slate-50">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-52 w-full"
          role="img"
          aria-label={`${unit} trend chart`}
        >
          {gridValues.map((value, index) => {
            const y = getY(value);

            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />

                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {value.toFixed(decimals)}
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#3566AB"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((point, index) => {
            const x = getX(index);
            const y = getY(point.value);

            return (
              <g key={`${point.label}-${index}`}>
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="white"
                  stroke="#3566AB"
                  strokeWidth="3"
                />

                <text
                  x={x}
                  y={height - 17}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {points.length} recorded{" "}
          {points.length === 1 ? "reading" : "readings"}
        </span>

        <span className="text-[11px] font-medium text-slate-400">
          {points[0].label} — {points[points.length - 1].label}
        </span>
      </div>
    </div>
  );
}

function BloodPressureChart({ points }: { points: BloodPressurePoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center rounded-xl bg-slate-50">
        <p className="text-xs text-slate-400">
          No blood-pressure trend available
        </p>
      </div>
    );
  }

  const width = 600;
  const height = 220;
  const paddingLeft = 48;
  const paddingRight = 18;
  const paddingTop = 18;
  const paddingBottom = 42;

  const values = points.flatMap((point) => [point.systolic, point.diastolic]);

  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = Math.max(maxValue - minValue, 20);

  const chartMin = minValue - range * 0.2;
  const chartMax = maxValue + range * 0.2;

  const getX = (index: number) => {
    if (points.length === 1) {
      return width / 2;
    }

    return (
      paddingLeft +
      (index / (points.length - 1)) * (width - paddingLeft - paddingRight)
    );
  };

  const getY = (value: number) =>
    paddingTop +
    ((chartMax - value) / (chartMax - chartMin)) *
      (height - paddingTop - paddingBottom);

  const systolicPoints = points
    .map((point, index) => `${getX(index)},${getY(point.systolic)}`)
    .join(" ");

  const diastolicPoints = points
    .map((point, index) => `${getX(index)},${getY(point.diastolic)}`)
    .join(" ");

  const gridValues = [0, 1, 2, 3].map(
    (index) => chartMax - (index / 3) * (chartMax - chartMin),
  );

  return (
    <div>
      <div className="overflow-hidden rounded-xl bg-slate-50">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-52 w-full"
          role="img"
          aria-label="Blood pressure trend chart"
        >
          {gridValues.map((value, index) => {
            const y = getY(value);

            return (
              <g key={index}>
                <line
                  x1={paddingLeft}
                  x2={width - paddingRight}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                />

                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {Math.round(value)}
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <>
              <polyline
                points={systolicPoints}
                fill="none"
                stroke="#3566AB"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <polyline
                points={diastolicPoints}
                fill="none"
                stroke="#83B7DE"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {points.map((point, index) => {
            const x = getX(index);
            const systolicY = getY(point.systolic);
            const diastolicY = getY(point.diastolic);

            return (
              <g key={`${point.label}-${index}`}>
                <circle
                  cx={x}
                  cy={systolicY}
                  r="4.5"
                  fill="white"
                  stroke="#3566AB"
                  strokeWidth="3"
                />

                <circle
                  cx={x}
                  cy={diastolicY}
                  r="4.5"
                  fill="white"
                  stroke="#83B7DE"
                  strokeWidth="3"
                />

                <text
                  x={x}
                  y={height - 17}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {point.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <LegendDot color="#3566AB" label="Systolic" />
          <LegendDot color="#83B7DE" label="Diastolic" />
        </div>

        <span className="text-[11px] text-slate-400">
          {points.length} {points.length === 1 ? "reading" : "readings"}
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function ClinicalHistoryCard({
  record,
  isLatest,
}: {
  record: HealthRecord;
  isLatest: boolean;
}) {
  return (
    <div className="telecare-card overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand">
            <Stethoscope size={19} />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                {record.doctorName}
              </h3>

              {isLatest && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                  Latest
                </span>
              )}
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              {record.doctorSpecialty ?? "TeleCare practitioner"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <CalendarDays size={14} />
          {formatFullDate(record.date)}
        </div>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_1fr_1.1fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Vitals
          </p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <MiniVital label="BP" value={record.bloodPressure} unit="mmHg" />

            <MiniVital label="HR" value={String(record.heartRate)} unit="bpm" />

            <MiniVital
              label="Temp"
              value={record.temperature.toFixed(1)}
              unit="°C"
            />
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Diagnosis
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">
            {record.diagnosis}
          </p>

          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Treatment plan
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            {record.treatmentPlan}
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Doctor&apos;s notes
          </p>

          {record.doctorNotes?.trim() ? (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {record.doctorNotes}
            </p>
          ) : (
            <p className="mt-2 text-sm italic leading-6 text-slate-400">
              No additional notes were recorded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniVital({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>

      <p className="mt-0.5 text-[10px] text-slate-400">{unit}</p>
    </div>
  );
}

function EmptyHealthState() {
  return (
    <section className="mt-8">
      <div className="telecare-card overflow-hidden">
        <div className="bg-gradient-to-br from-brand-dark to-brand px-6 py-10 text-center text-white sm:px-10 sm:py-14">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <HeartPulse size={27} />
          </div>

          <h2 className="mt-5 text-xl font-bold sm:text-2xl">
            Your health metrics will appear here
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-blue-100">
            Complete a TeleCare consultation with recorded vital signs to start
            building your health history and trends.
          </p>

          <Link
            href="/patient/book"
            className="telecare-button mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand hover:bg-blue-50"
          >
            Book Consultation
            <ArrowRight size={15} />
          </Link>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <EmptyMetric icon={HeartPulse} label="Blood pressure" />
          <EmptyMetric icon={Activity} label="Heart rate" />
          <EmptyMetric icon={Thermometer} label="Temperature" />
        </div>
      </div>
    </section>
  );
}

function EmptyMetric({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">No data recorded</p>
      </div>
    </div>
  );
}

function parseBloodPressure(
  value: string,
): { systolic: number; diastolic: number } | null {
  const match = value.trim().match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);

  if (!match) {
    return null;
  }

  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);

  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
    return null;
  }

  return {
    systolic,
    diastolic,
  };
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMetricDate(date: Date): string {
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}
