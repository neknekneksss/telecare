"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  Thermometer,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { useAppointments } from "@/store/appointments";
import { useClinicalNotes } from "@/store/clinicalNotes";
import { usePrescriptions } from "@/store/prescriptions";
import { useMedicationLogs } from "@/store/medicationLogs";
import { useReminders } from "@/store/reminders";

type Measurement = {
  appointmentId: string;
  dateTime: string;
  doctorName: string;
  doctorSpecialty: string;
  diagnosis: string;
  treatmentPlan: string;
  bloodPressure: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  temperature: number;
};

type MeasurementChange = {
  value: number;
  label: string;
};

export default function PatientProgressPage() {
  const router = useRouter();

  const { role, userId } = useSession();

  const patients = useUsers((state) => state.patients);
  const doctors = useUsers((state) => state.doctors);

  const appointments = useAppointments((state) => state.appointments);
  const loadAppointments = useAppointments((state) => state.loadAppointments);

  const clinicalNotes = useClinicalNotes((state) => state.clinicalNotes);
  const loadClinicalNotes = useClinicalNotes(
    (state) => state.loadClinicalNotes,
  );

  const prescriptions = usePrescriptions((state) => state.prescriptions);
  const loadPrescriptions = usePrescriptions(
    (state) => state.loadPrescriptions,
  );

  const medicationLogs = useMedicationLogs((state) => state.medicationLogs);
  const loadMedicationLogs = useMedicationLogs(
    (state) => state.loadMedicationLogs,
  );

  const reminders = useReminders((state) => state.reminders);
  const loadReminders = useReminders((state) => state.loadReminders);

  useEffect(() => {
    if (role !== "patient" || !userId) {
      router.replace("/login");
    }
  }, [role, userId, router]);

  useEffect(() => {
    if (role !== "patient" || !userId) {
      return;
    }

    void Promise.all([
      loadAppointments(),
      loadClinicalNotes(),
      loadPrescriptions(),
      loadMedicationLogs(),
      loadReminders(),
    ]);
  }, [
    role,
    userId,
    loadAppointments,
    loadClinicalNotes,
    loadPrescriptions,
    loadMedicationLogs,
    loadReminders,
  ]);

  const patient = useMemo(
    () => patients.find((item) => item.id === userId),
    [patients, userId],
  );

  const patientAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.patientId === userId)
        .sort(
          (a, b) =>
            new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
        ),
    [appointments, userId],
  );

  const completedAppointments = useMemo(
    () =>
      patientAppointments
        .filter((appointment) => appointment.status === "completed")
        .sort(
          (a, b) =>
            new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime(),
        ),
    [patientAppointments],
  );

  const measurements = useMemo<Measurement[]>(() => {
    return completedAppointments
      .map((appointment) => {
        const note = clinicalNotes.find(
          (item) => item.appointmentId === appointment.id,
        );

        if (!note) {
          return null;
        }

        const [systolicText, diastolicText] =
          note.vitals.bloodPressure.split("/");

        const systolic = Number(systolicText);
        const diastolic = Number(diastolicText);

        if (
          !Number.isFinite(systolic) ||
          !Number.isFinite(diastolic) ||
          !Number.isFinite(note.vitals.heartRate) ||
          !Number.isFinite(note.vitals.temperature)
        ) {
          return null;
        }

        const doctor = doctors.find((item) => item.id === appointment.doctorId);

        return {
          appointmentId: appointment.id,
          dateTime: appointment.dateTime,
          doctorName: doctor?.name ?? "Your Doctor",
          doctorSpecialty: doctor?.specialty ?? "Healthcare Practitioner",
          diagnosis: note.diagnosis,
          treatmentPlan: note.treatmentPlan,
          bloodPressure: note.vitals.bloodPressure,
          systolic,
          diastolic,
          heartRate: note.vitals.heartRate,
          temperature: note.vitals.temperature,
        };
      })
      .filter((measurement): measurement is Measurement => measurement !== null)
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );
  }, [completedAppointments, clinicalNotes, doctors]);

  const latestMeasurement = measurements[measurements.length - 1];

  const previousMeasurement =
    measurements.length >= 2
      ? measurements[measurements.length - 2]
      : undefined;

  const recentMeasurements = useMemo(
    () => measurements.slice().reverse().slice(0, 6),
    [measurements],
  );

  const patientPrescriptions = useMemo(
    () =>
      prescriptions.filter((prescription) => prescription.patientId === userId),
    [prescriptions, userId],
  );

  const trackedMedicationLogs = useMemo(
    () =>
      medicationLogs.filter((log) => {
        const prescription = prescriptions.find(
          (item) => item.id === log.prescriptionId,
        );

        return (
          prescription?.patientId === userId &&
          new Date(log.scheduledFor).getTime() <= Date.now()
        );
      }),
    [medicationLogs, prescriptions, userId],
  );

  const takenMedicationLogs = useMemo(
    () => trackedMedicationLogs.filter((log) => Boolean(log.takenAt)),
    [trackedMedicationLogs],
  );

  const missedMedicationLogs = useMemo(
    () => trackedMedicationLogs.filter((log) => !log.takenAt),
    [trackedMedicationLogs],
  );

  const medicationAdherence = useMemo(() => {
    if (trackedMedicationLogs.length === 0) {
      return null;
    }

    return Math.round(
      (takenMedicationLogs.length / trackedMedicationLogs.length) * 100,
    );
  }, [takenMedicationLogs.length, trackedMedicationLogs.length]);

  const activeFollowUps = useMemo(
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

  const nextFollowUp = activeFollowUps[0];

  const nextFollowUpDoctor = nextFollowUp?.doctorId
    ? doctors.find((doctor) => doctor.id === nextFollowUp.doctorId)
    : undefined;

  const consultationRate = useMemo(() => {
    if (patientAppointments.length === 0) {
      return 0;
    }

    return Math.round(
      (completedAppointments.length / patientAppointments.length) * 100,
    );
  }, [completedAppointments.length, patientAppointments.length]);

  const measurementChanges = useMemo(() => {
    if (!latestMeasurement || !previousMeasurement) {
      return null;
    }

    return {
      systolic: getMeasurementChange(
        latestMeasurement.systolic,
        previousMeasurement.systolic,
      ),
      diastolic: getMeasurementChange(
        latestMeasurement.diastolic,
        previousMeasurement.diastolic,
      ),
      heartRate: getMeasurementChange(
        latestMeasurement.heartRate,
        previousMeasurement.heartRate,
      ),
      temperature: getMeasurementChange(
        latestMeasurement.temperature,
        previousMeasurement.temperature,
      ),
    };
  }, [latestMeasurement, previousMeasurement]);

  const healthStatuses = useMemo(() => {
    if (!latestMeasurement) {
      return null;
    }

    return {
      bloodPressure: getBloodPressureStatus(
        latestMeasurement.systolic,
        latestMeasurement.diastolic,
      ),
      heartRate: getHeartRateStatus(latestMeasurement.heartRate),
      temperature: getTemperatureStatus(latestMeasurement.temperature),
    };
  }, [latestMeasurement]);

  if (role !== "patient" || !userId || !patient) {
    return null;
  }

  const firstName = patient.name.split(" ")[0];

  return (
    <main className="page-enter min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="fade-up">
          <Link
            href="/patient/dashboard"
            className="telecare-button mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-600 hover:border-brand-light hover:text-brand-dark"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-brand">
                Health &amp; Progress
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {firstName}&apos;s health overview
              </h1>

              <p className="mt-1.5 max-w-2xl text-sm text-slate-500 sm:text-base">
                Track your recent measurements, care activity, medications, and
                follow-up recommendations in one place.
              </p>
            </div>

            <Link
              href="/patient/records"
              className="telecare-button inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-light hover:text-brand-dark"
            >
              <FileText size={16} />
              View records
            </Link>
          </div>
        </section>

        <section className="mt-7 fade-up fade-up-delay-1">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Latest health snapshot
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Your most recent recorded measurements.
            </p>
          </div>

          {latestMeasurement ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <HealthMetricCard
                  icon={HeartPulse}
                  label="Blood Pressure"
                  value={latestMeasurement.bloodPressure}
                  suffix="mmHg"
                  description={
                    measurementChanges
                      ? formatChangeDescription(
                          measurementChanges.systolic.value,
                          "systolic",
                        )
                      : "Latest reading"
                  }
                  iconClassName="bg-rose-50 text-rose-600"
                  status={healthStatuses?.bloodPressure}
                />

                <HealthMetricCard
                  icon={Activity}
                  label="Heart Rate"
                  value={String(latestMeasurement.heartRate)}
                  suffix="bpm"
                  description={
                    measurementChanges
                      ? formatChangeDescription(
                          measurementChanges.heartRate.value,
                          "heart rate",
                        )
                      : "Latest reading"
                  }
                  iconClassName="bg-blue-50 text-brand"
                  status={healthStatuses?.heartRate}
                />

                <HealthMetricCard
                  icon={Thermometer}
                  label="Temperature"
                  value={latestMeasurement.temperature.toFixed(1)}
                  suffix="°C"
                  description={
                    measurementChanges
                      ? formatChangeDescription(
                          measurementChanges.temperature.value,
                          "temperature",
                        )
                      : "Latest reading"
                  }
                  iconClassName="bg-amber-50 text-amber-600"
                  status={healthStatuses?.temperature}
                />

                <HealthMetricCard
                  icon={CalendarCheck}
                  label="Consultations"
                  value={String(completedAppointments.length)}
                  suffix="completed"
                  description={`${consultationRate}% completion rate`}
                  iconClassName="bg-emerald-50 text-emerald-600"
                />
              </div>

              {measurementChanges && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Since your previous recorded visit
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Changes are shown for reference only and do not
                        represent a medical diagnosis.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ChangeBadge
                        label="Systolic"
                        value={measurementChanges.systolic.value}
                        suffix="mmHg"
                      />

                      <ChangeBadge
                        label="Diastolic"
                        value={measurementChanges.diastolic.value}
                        suffix="mmHg"
                      />

                      <ChangeBadge
                        label="Heart rate"
                        value={measurementChanges.heartRate.value}
                        suffix="bpm"
                      />

                      <ChangeBadge
                        label="Temperature"
                        value={measurementChanges.temperature.value}
                        suffix="°C"
                        decimal
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <EmptyHealthState />
          )}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] fade-up fade-up-delay-2">
          <div className="telecare-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Care progress
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  A summary of your current TeleCare activity.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-2.5 text-brand">
                <TrendingUp size={19} />
              </div>
            </div>

            <div className="mt-6 space-y-6">
              <ProgressRow
                icon={CalendarCheck}
                iconClassName="bg-emerald-50 text-emerald-600"
                title="Completed consultations"
                description={`${completedAppointments.length} completed out of ${patientAppointments.length} recorded appointments`}
                percentage={consultationRate}
                value={`${completedAppointments.length}`}
              />

              <ProgressRow
                icon={Pill}
                iconClassName="bg-purple-50 text-purple-600"
                title="Medication adherence"
                description={
                  medicationAdherence === null
                    ? "Track medication doses to see your adherence"
                    : `${trackedMedicationLogs.length} tracked dose${
                        trackedMedicationLogs.length === 1 ? "" : "s"
                      }`
                }
                percentage={medicationAdherence ?? 0}
                value={
                  medicationAdherence === null ? "—" : `${medicationAdherence}%`
                }
                showBar={medicationAdherence !== null}
              />

              <ProgressRow
                icon={ClipboardCheck}
                iconClassName="bg-sky-50 text-sky-600"
                title="Follow-up care"
                description={
                  nextFollowUp
                    ? "A follow-up has been recommended by your doctor"
                    : "No active follow-up recommendation"
                }
                percentage={nextFollowUp ? 100 : 0}
                value={nextFollowUp ? "Scheduled" : "Clear"}
                showBar={false}
              />
            </div>
          </div>

          <div className="telecare-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Current care
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Your active care items.
                </p>
              </div>

              <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600">
                <Stethoscope size={19} />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
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
                  {patientPrescriptions.length}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-brand">
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
                  {
                    patientAppointments.filter(
                      (appointment) => appointment.status === "upcoming",
                    ).length
                  }
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
                    <ClipboardCheck size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">
                      Follow-up
                    </p>

                    <p className="truncate text-xs text-slate-500">
                      {nextFollowUp
                        ? "Doctor recommendation"
                        : "No active recommendation"}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-sm font-bold ${
                    nextFollowUp ? "text-brand" : "text-slate-400"
                  }`}
                >
                  {nextFollowUp ? "Active" : "None"}
                </span>
              </div>
            </div>

            <Link
              href="/patient/medications"
              className="telecare-button mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-light hover:text-brand-dark"
            >
              Manage medications
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="mt-7 fade-up fade-up-delay-2">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-900">
              Medication progress
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Your tracked medication activity and adherence.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="telecare-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Adherence overview
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Based on doses that have already been scheduled.
                  </p>
                </div>

                <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                  <Pill size={19} />
                </div>
              </div>

              {medicationAdherence !== null ? (
                <div className="mt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-4xl font-bold tracking-tight text-slate-900">
                        {medicationAdherence}%
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Overall tracked adherence
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      <p>
                        <span className="font-bold text-emerald-600">
                          {takenMedicationLogs.length}
                        </span>{" "}
                        taken
                      </p>

                      <p className="mt-1">
                        <span className="font-bold text-amber-600">
                          {missedMedicationLogs.length}
                        </span>{" "}
                        pending
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, medicationAdherence),
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {trackedMedicationLogs.length} total tracked dose
                      {trackedMedicationLogs.length === 1 ? "" : "s"}
                    </span>

                    <span>{medicationAdherence}% recorded as taken</span>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl bg-slate-50 p-5 text-center">
                  <Pill size={22} className="mx-auto text-slate-300" />

                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    No medication doses tracked yet
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Once medication doses are recorded, your adherence
                    percentage will appear here.
                  </p>
                </div>
              )}

              <Link
                href="/patient/medications"
                className="telecare-button mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                Open medication tracker
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="telecare-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Prescription summary
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Medication currently recorded in your care history.
                  </p>
                </div>

                <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700">
                  {patientPrescriptions.length} medication
                  {patientPrescriptions.length === 1 ? "" : "s"}
                </span>
              </div>

              {patientPrescriptions.length > 0 ? (
                <div className="mt-5 divide-y divide-slate-100">
                  {patientPrescriptions.slice(0, 4).map((prescription) => (
                    <div
                      key={prescription.id}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                        <Pill size={16} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {prescription.medication}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {prescription.dosage} · {prescription.schedule}
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Next dose: {formatDateTime(prescription.nextDose)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-xl bg-slate-50 p-5 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    No prescriptions recorded
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Prescriptions from completed consultations will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-7 fade-up fade-up-delay-2">
          <div className="mb-3">
            <h2 className="text-lg font-bold text-slate-900">Health trends</h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Trends from your completed consultations.
            </p>
          </div>

          {measurements.length >= 2 ? (
            <div className="grid gap-5 xl:grid-cols-3">
              <TrendCard
                title="Blood Pressure"
                subtitle="Systolic pressure"
                value={`${latestMeasurement?.systolic ?? "—"} mmHg`}
                data={measurements.map((item) => item.systolic)}
                dates={measurements.map((item) => item.dateTime)}
                suffix="mmHg"
                icon={HeartPulse}
                iconClassName="bg-rose-50 text-rose-600"
              />

              <TrendCard
                title="Heart Rate"
                subtitle="Resting measurement"
                value={`${latestMeasurement?.heartRate ?? "—"} bpm`}
                data={measurements.map((item) => item.heartRate)}
                dates={measurements.map((item) => item.dateTime)}
                suffix="bpm"
                icon={Activity}
                iconClassName="bg-blue-50 text-brand"
              />

              <TrendCard
                title="Temperature"
                subtitle="Body temperature"
                value={
                  latestMeasurement
                    ? `${latestMeasurement.temperature.toFixed(1)} °C`
                    : "—"
                }
                data={measurements.map((item) => item.temperature)}
                dates={measurements.map((item) => item.dateTime)}
                suffix="°C"
                decimal
                icon={Thermometer}
                iconClassName="bg-amber-50 text-amber-600"
              />
            </div>
          ) : (
            <div className="telecare-card p-8 text-center sm:p-10">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand">
                <TrendingUp size={22} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-slate-800">
                More health data will appear here
              </h3>

              <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
                Health trends become available after multiple completed
                consultations with recorded clinical measurements.
              </p>
            </div>
          )}
        </section>

        {nextFollowUp && (
          <section className="mt-7 fade-up fade-up-delay-3">
            <div className="telecare-card overflow-hidden">
              <div className="border-b border-slate-100 bg-blue-50/60 px-5 py-4 sm:px-6">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-sm">
                    <ClipboardCheck size={19} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900">
                        Recommended follow-up
                      </h2>

                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        Doctor recommended
                      </span>
                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      A follow-up was recommended as part of your continuing
                      care.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                        <UserRound size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {nextFollowUpDoctor?.name ?? "Your Doctor"}
                        </p>

                        {nextFollowUpDoctor?.specialty && (
                          <p className="truncate text-xs text-slate-500">
                            {nextFollowUpDoctor.specialty}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <InfoBox
                        label="Recommended date"
                        value={new Date(
                          nextFollowUp.dueDate,
                        ).toLocaleDateString([], {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      />

                      <InfoBox
                        label="Recommended time"
                        value={new Date(
                          nextFollowUp.dueDate,
                        ).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      />
                    </div>

                    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Follow-up details
                      </p>

                      <p className="mt-1.5 text-sm leading-6 text-slate-700">
                        {nextFollowUp.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-44">
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
                      View appointments
                    </Link>
                  </div>
                </div>

                <div className="mt-4 rounded-lg border border-slate-100 bg-white px-3.5 py-3">
                  <p className="text-xs leading-5 text-slate-500">
                    This recommendation is not a booked consultation. Use the
                    booking flow to schedule the actual appointment.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mt-7 fade-up fade-up-delay-3">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Recent measurements
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Your latest recorded clinical readings.
              </p>
            </div>

            <Link
              href="/patient/records"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-dark"
            >
              View full records
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentMeasurements.length > 0 ? (
            <div className="telecare-card overflow-hidden">
              <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid sm:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1fr] sm:gap-4">
                <span>Date</span>
                <span>Doctor</span>
                <span>Blood pressure</span>
                <span>Heart rate</span>
                <span>Temperature</span>
              </div>

              <div className="divide-y divide-slate-100">
                {recentMeasurements.map((measurement) => (
                  <MeasurementRow
                    key={measurement.appointmentId}
                    measurement={measurement}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="telecare-card p-8 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <HeartPulse size={20} />
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No clinical measurements yet
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
                Recorded vital signs from completed consultations will appear
                here.
              </p>
            </div>
          )}
        </section>

        {latestMeasurement && (
          <section className="mt-7 grid gap-5 pb-4 lg:grid-cols-2 fade-up fade-up-delay-3">
            <InfoPanel
              icon={FileText}
              iconClassName="bg-blue-50 text-brand"
              title="Latest diagnosis"
              description="Most recent clinical assessment"
            >
              <p className="text-sm leading-6 text-slate-700">
                {latestMeasurement.diagnosis}
              </p>
            </InfoPanel>

            <InfoPanel
              icon={ClipboardCheck}
              iconClassName="bg-emerald-50 text-emerald-600"
              title="Latest treatment plan"
              description="Most recent care instructions"
            >
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {latestMeasurement.treatmentPlan}
              </p>
            </InfoPanel>
          </section>
        )}

        <div className="mt-7 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs leading-5 text-slate-500">
          <span className="font-semibold text-slate-700">
            TeleCare prototype:
          </span>{" "}
          health trends and medication adherence are generated from data
          recorded within the platform. They are for demonstration purposes and
          are not a substitute for professional medical advice.
        </div>
      </div>
    </main>
  );
}

function HealthMetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  description,
  iconClassName,
  status,
}: {
  icon: typeof HeartPulse;
  label: string;
  value: string;
  suffix: string;
  description: string;
  iconClassName: string;
  status?: "within-reference" | "review";
}) {
  return (
    <div className="telecare-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`rounded-xl p-2.5 ${iconClassName}`}>
          <Icon size={19} />
        </div>

        {status ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold ${
              status === "within-reference"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <CheckCircle2 size={11} />

            {status === "within-reference"
              ? "Within reference"
              : "Review reading"}
          </span>
        ) : (
          <HeartPulse size={15} className="text-slate-200" />
        )}
      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>

      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </span>

        <span className="text-xs font-medium text-slate-400">{suffix}</span>
      </div>

      <p className="mt-1.5 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function ChangeBadge({
  label,
  value,
  suffix,
  decimal = false,
}: {
  label: string;
  value: number;
  suffix: string;
  decimal?: boolean;
}) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] font-semibold text-slate-400">{label}</p>

      <p
        className={`mt-0.5 text-xs font-bold ${
          isPositive
            ? "text-amber-600"
            : isNegative
              ? "text-emerald-600"
              : "text-slate-500"
        }`}
      >
        {value > 0 ? "+" : ""}
        {decimal ? value.toFixed(1) : Math.round(value)} {suffix}
      </p>
    </div>
  );
}

function ProgressRow({
  icon: Icon,
  iconClassName,
  title,
  description,
  percentage,
  value,
  showBar = true,
}: {
  icon: typeof CalendarCheck;
  iconClassName: string;
  title: string;
  description: string;
  percentage: number;
  value: string;
  showBar?: boolean;
}) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 rounded-xl p-2.5 ${iconClassName}`}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">{title}</p>

              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                {description}
              </p>
            </div>

            <span className="shrink-0 text-sm font-bold text-slate-900">
              {value}
            </span>
          </div>

          {showBar && (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand transition-all duration-700"
                style={{
                  width: `${Math.max(0, Math.min(100, percentage))}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TrendCard({
  title,
  subtitle,
  value,
  data,
  dates,
  suffix,
  decimal = false,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  subtitle: string;
  value: string;
  data: number[];
  dates: string[];
  suffix: string;
  decimal?: boolean;
  icon: typeof HeartPulse;
  iconClassName: string;
}) {
  const chartWidth = 640;
  const chartHeight = 190;
  const paddingX = 24;
  const paddingY = 20;

  const minData = Math.min(...data);
  const maxData = Math.max(...data);

  const range = Math.max(maxData - minData, decimal ? 0.4 : 8);

  const minValue = minData - range * 0.15;
  const maxValue = maxData + range * 0.15;

  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingY * 2;

  const points = data.map((valueAtIndex, index) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : paddingX + (index / (data.length - 1)) * usableWidth;

    const normalized = (valueAtIndex - minValue) / (maxValue - minValue);

    const y = chartHeight - paddingY - normalized * usableHeight;

    return {
      x,
      y,
      value: valueAtIndex,
    };
  });

  const path = points
    .map((point, index) =>
      index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`,
    )
    .join(" ");

  const formatted = (number: number) =>
    decimal ? number.toFixed(1) : Math.round(number).toString();

  return (
    <div className="telecare-card overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <div className={`mb-3 inline-flex rounded-xl p-2.5 ${iconClassName}`}>
            <Icon size={18} />
          </div>

          <h3 className="text-sm font-bold text-slate-900">{title}</h3>

          <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-slate-900">{value}</p>

          <p className="mt-0.5 text-[11px] text-slate-400">Latest reading</p>
        </div>
      </div>

      <div className="border-t border-slate-100 px-2 pb-3 pt-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="h-48 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`${title} trend chart`}
        >
          <line
            x1={paddingX}
            x2={chartWidth - paddingX}
            y1={paddingY}
            y2={paddingY}
            stroke="currentColor"
            className="text-slate-100"
          />

          <line
            x1={paddingX}
            x2={chartWidth - paddingX}
            y1={chartHeight / 2}
            y2={chartHeight / 2}
            stroke="currentColor"
            className="text-slate-100"
          />

          <line
            x1={paddingX}
            x2={chartWidth - paddingX}
            y1={chartHeight - paddingY}
            y2={chartHeight - paddingY}
            stroke="currentColor"
            className="text-slate-100"
          />

          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand"
          />

          {points.map((point, index) => (
            <g key={`${dates[index]}-${index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke="currentColor"
                strokeWidth="3"
                className="text-brand"
              />

              <text
                x={point.x}
                y={chartHeight - 3}
                textAnchor="middle"
                className="fill-slate-400 text-[10px]"
              >
                {new Date(dates[index]).toLocaleDateString([], {
                  month: "short",
                  day: "numeric",
                })}
              </text>
            </g>
          ))}
        </svg>

        <div className="flex items-center justify-between px-3 text-[11px] text-slate-400">
          <span>
            Lowest {formatted(minData)} {suffix}
          </span>

          <span>
            Highest {formatted(maxData)} {suffix}
          </span>
        </div>
      </div>
    </div>
  );
}

function MeasurementRow({ measurement }: { measurement: Measurement }) {
  const date = new Date(measurement.dateTime);

  const formattedDate = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="px-5 py-4 sm:px-6">
      <div className="grid gap-3 sm:grid-cols-[1.1fr_1fr_0.8fr_0.8fr_1fr] sm:items-center sm:gap-4">
        <div>
          <p className="text-xs font-semibold text-slate-800 sm:text-sm">
            {formattedDate}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            Completed consultation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-brand">
            <Stethoscope size={14} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-slate-700">
              {measurement.doctorName}
            </p>

            <p className="truncate text-[11px] text-slate-400">
              {measurement.doctorSpecialty}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:block">
          <span className="text-[11px] font-medium text-slate-400 sm:hidden">
            Blood pressure
          </span>

          <span className="text-sm font-semibold text-slate-800">
            {measurement.bloodPressure}

            <span className="ml-1 text-[11px] font-medium text-slate-400">
              mmHg
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between sm:block">
          <span className="text-[11px] font-medium text-slate-400 sm:hidden">
            Heart rate
          </span>

          <span className="text-sm font-semibold text-slate-800">
            {measurement.heartRate}

            <span className="ml-1 text-[11px] font-medium text-slate-400">
              bpm
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between sm:block">
          <span className="text-[11px] font-medium text-slate-400 sm:hidden">
            Temperature
          </span>

          <span className="text-sm font-semibold text-slate-800">
            {measurement.temperature.toFixed(1)}

            <span className="ml-1 text-[11px] font-medium text-slate-400">
              °C
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1.5 text-sm font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function InfoPanel({
  icon: Icon,
  iconClassName,
  title,
  description,
  children,
}: {
  icon: typeof FileText;
  iconClassName: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="telecare-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className={`rounded-xl p-2.5 ${iconClassName}`}>
          <Icon size={18} />
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>

          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-slate-50 p-4">{children}</div>
    </div>
  );
}

function EmptyHealthState() {
  return (
    <div className="telecare-card p-8 text-center sm:p-10">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-brand">
        <HeartPulse size={22} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-800">
        No health measurements yet
      </h3>

      <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-slate-500">
        Your blood pressure, heart rate, and temperature will appear here after
        a completed consultation with recorded clinical notes.
      </p>

      <Link
        href="/patient/book"
        className="telecare-button mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Book consultation
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function getMeasurementChange(current: number, previous: number) {
  return {
    value: Number((current - previous).toFixed(1)),
    label:
      current > previous
        ? "increased"
        : current < previous
          ? "decreased"
          : "unchanged",
  } satisfies MeasurementChange;
}

function formatChangeDescription(value: number, metric: string) {
  if (value === 0) {
    return `No change in ${metric}`;
  }

  const direction = value > 0 ? "increased" : "decreased";
  const absoluteValue = Math.abs(value);

  return `${metric} ${direction} by ${absoluteValue}`;
}

function getBloodPressureStatus(
  systolic: number,
  diastolic: number,
): "within-reference" | "review" {
  const withinReference =
    systolic >= 90 && systolic < 130 && diastolic >= 60 && diastolic < 80;

  return withinReference ? "within-reference" : "review";
}

function getHeartRateStatus(heartRate: number): "within-reference" | "review" {
  const withinReference = heartRate >= 60 && heartRate <= 100;

  return withinReference ? "within-reference" : "review";
}

function getTemperatureStatus(
  temperature: number,
): "within-reference" | "review" {
  const withinReference = temperature >= 36.1 && temperature <= 37.2;

  return withinReference ? "within-reference" : "review";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
