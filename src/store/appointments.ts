"use client";

import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { Appointment } from "@/lib/types";
import { appointments as seedAppointments } from "@/lib/mock-data/appointments";

interface AddAppointmentInput {
  patientId: string;
  doctorId: string;
  dateTime: string;
  reasonForVisit: string;
  urgency: Appointment["urgency"];
  triage?: Appointment["triage"];
  consultationFee?: number;
}

interface AppointmentsState {
  appointments: Appointment[];
  isLoading: boolean;

  loadAppointments: () => Promise<void>;

  addAppointment: (input: AddAppointmentInput) => Promise<Appointment>;

  updateAppointment: (
    id: string,
    updates: Partial<Appointment>,
  ) => Promise<void>;

  cancelAppointment: (id: string) => Promise<void>;

  getAppointmentById: (id: string) => Appointment | undefined;
}

function mapDatabaseAppointment(row: any): Appointment {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    dateTime: row.date_time,
    status: row.status,
    reasonForVisit: row.reason_for_visit,
    urgency: row.urgency,
    triage: row.triage ?? undefined,
    consultationFee: Number(row.consultation_fee ?? 800),
  };
}

export const useAppointments = create<AppointmentsState>((set, get) => ({
  appointments: seedAppointments,

  isLoading: false,

  loadAppointments: async () => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("date_time", { ascending: true });

    if (error) {
      console.error("Failed to load appointments:", error);
      set({ isLoading: false });
      return;
    }

    const databaseAppointments = (data ?? []).map(mapDatabaseAppointment);

    const combined = [...seedAppointments, ...databaseAppointments];

    const uniqueAppointments = Array.from(
      new Map(
        combined.map((appointment) => [appointment.id, appointment]),
      ).values(),
    );

    set({
      appointments: uniqueAppointments,
      isLoading: false,
    });
  },

  addAppointment: async (input) => {
    const newAppointment: Appointment = {
      id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientId: input.patientId,
      doctorId: input.doctorId,
      dateTime: input.dateTime,
      status: "upcoming",
      reasonForVisit: input.reasonForVisit,
      urgency: input.urgency,
      triage: input.triage,
      consultationFee: input.consultationFee ?? 800,
    };

    const { error } = await supabase.from("appointments").insert({
      id: newAppointment.id,
      patient_id: newAppointment.patientId,
      doctor_id: newAppointment.doctorId,
      date_time: newAppointment.dateTime,
      status: newAppointment.status,
      reason_for_visit: newAppointment.reasonForVisit,
      urgency: newAppointment.urgency,
      triage: newAppointment.triage ?? null,
      consultation_fee: newAppointment.consultationFee,
    });

    if (error) {
      console.error("Failed to create appointment:", error);

      throw new Error(`Failed to create appointment: ${error.message}`);
    }

    set((state) => ({
      appointments: [...state.appointments, newAppointment],
    }));

    return newAppointment;
  },

  updateAppointment: async (id, updates) => {
    const databaseUpdates: Record<string, unknown> = {};

    if (updates.patientId !== undefined) {
      databaseUpdates.patient_id = updates.patientId;
    }

    if (updates.doctorId !== undefined) {
      databaseUpdates.doctor_id = updates.doctorId;
    }

    if (updates.dateTime !== undefined) {
      databaseUpdates.date_time = updates.dateTime;
    }

    if (updates.status !== undefined) {
      databaseUpdates.status = updates.status;
    }

    if (updates.reasonForVisit !== undefined) {
      databaseUpdates.reason_for_visit = updates.reasonForVisit;
    }

    if (updates.urgency !== undefined) {
      databaseUpdates.urgency = updates.urgency;
    }

    if (updates.triage !== undefined) {
      databaseUpdates.triage = updates.triage;
    }

    if (updates.consultationFee !== undefined) {
      databaseUpdates.consultation_fee = updates.consultationFee;
    }

    const { error } = await supabase
      .from("appointments")
      .update(databaseUpdates)
      .eq("id", id);

    if (error) {
      console.error("Failed to update appointment:", error);

      throw new Error(`Failed to update appointment: ${error.message}`);
    }

    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              ...updates,
            }
          : appointment,
      ),
    }));
  },

  cancelAppointment: async (id) => {
    const { error } = await supabase
      .from("appointments")
      .update({
        status: "cancelled",
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to cancel appointment:", error);

      throw new Error(`Failed to cancel appointment: ${error.message}`);
    }

    set((state) => ({
      appointments: state.appointments.map((appointment) =>
        appointment.id === id
          ? {
              ...appointment,
              status: "cancelled",
            }
          : appointment,
      ),
    }));
  },

  getAppointmentById: (id) => {
    return get().appointments.find((appointment) => appointment.id === id);
  },
}));
