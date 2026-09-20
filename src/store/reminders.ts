"use client";

import { create } from "zustand";

import { supabase } from "@/lib/supabase";

export type ReminderType = "follow-up" | "medication" | "appointment";

export interface TeleCareReminder {
  id: string;
  patientId: string;
  doctorId?: string;
  type: ReminderType;
  title: string;
  message: string;
  dueDate: string;
  relatedAppointmentId?: string;
  completed: boolean;
  createdAt: string;
}

interface AddReminderInput {
  patientId: string;
  doctorId?: string;
  type: ReminderType;
  title: string;
  message: string;
  dueDate: string;
  relatedAppointmentId?: string;
}

interface RemindersState {
  reminders: TeleCareReminder[];
  isLoading: boolean;

  loadReminders: () => Promise<void>;

  addReminder: (input: AddReminderInput) => Promise<TeleCareReminder>;

  updateReminder: (
    id: string,
    updates: Partial<TeleCareReminder>,
  ) => Promise<void>;

  completeReminder: (id: string) => Promise<void>;

  deleteReminder: (id: string) => Promise<void>;

  getReminderById: (id: string) => TeleCareReminder | undefined;

  getRemindersForPatient: (patientId: string) => TeleCareReminder[];

  getRemindersForDoctor: (doctorId: string) => TeleCareReminder[];
}

function mapDatabaseReminder(row: any): TeleCareReminder {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id ?? undefined,
    type: row.type,
    title: row.title,
    message: row.message,
    dueDate: row.due_date,
    relatedAppointmentId: row.related_appointment_id ?? undefined,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
  };
}

export const useReminders = create<RemindersState>((set, get) => ({
  reminders: [],
  isLoading: false,

  loadReminders: async () => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .order("due_date", {
        ascending: true,
      });

    if (error) {
      console.error("Failed to load reminders:", error);

      set({ isLoading: false });
      return;
    }

    set({
      reminders: (data ?? []).map(mapDatabaseReminder),
      isLoading: false,
    });
  },

  addReminder: async (input) => {
    const newReminder: TeleCareReminder = {
      id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientId: input.patientId,
      doctorId: input.doctorId,
      type: input.type,
      title: input.title,
      message: input.message,
      dueDate: input.dueDate,
      relatedAppointmentId: input.relatedAppointmentId,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("reminders")
      .insert({
        id: newReminder.id,
        patient_id: newReminder.patientId,
        doctor_id: newReminder.doctorId ?? null,
        type: newReminder.type,
        title: newReminder.title,
        message: newReminder.message,
        due_date: newReminder.dueDate,
        related_appointment_id: newReminder.relatedAppointmentId ?? null,
        completed: newReminder.completed,
        created_at: newReminder.createdAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create reminder:", error);

      throw new Error(`Failed to create reminder: ${error.message}`);
    }

    const savedReminder = mapDatabaseReminder(data);

    set((state) => ({
      reminders: [...state.reminders, savedReminder],
    }));

    return savedReminder;
  },

  updateReminder: async (id, updates) => {
    const existing = get().reminders.find((reminder) => reminder.id === id);

    if (!existing) {
      throw new Error("Cannot update reminder because it does not exist.");
    }

    const updatedReminder: TeleCareReminder = {
      ...existing,
      ...updates,
    };

    const { error } = await supabase
      .from("reminders")
      .update({
        patient_id: updatedReminder.patientId,
        doctor_id: updatedReminder.doctorId ?? null,
        type: updatedReminder.type,
        title: updatedReminder.title,
        message: updatedReminder.message,
        due_date: updatedReminder.dueDate,
        related_appointment_id: updatedReminder.relatedAppointmentId ?? null,
        completed: updatedReminder.completed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update reminder:", error);

      throw new Error(`Failed to update reminder: ${error.message}`);
    }

    set((state) => ({
      reminders: state.reminders.map((reminder) =>
        reminder.id === id ? updatedReminder : reminder,
      ),
    }));
  },

  completeReminder: async (id) => {
    const { error } = await supabase
      .from("reminders")
      .update({
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to complete reminder:", error);

      throw new Error(`Failed to complete reminder: ${error.message}`);
    }

    set((state) => ({
      reminders: state.reminders.map((reminder) =>
        reminder.id === id
          ? {
              ...reminder,
              completed: true,
            }
          : reminder,
      ),
    }));
  },

  deleteReminder: async (id) => {
    const { error } = await supabase.from("reminders").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete reminder:", error);

      throw new Error(`Failed to delete reminder: ${error.message}`);
    }

    set((state) => ({
      reminders: state.reminders.filter((reminder) => reminder.id !== id),
    }));
  },

  getReminderById: (id) => {
    return get().reminders.find((reminder) => reminder.id === id);
  },

  getRemindersForPatient: (patientId) => {
    return get().reminders.filter(
      (reminder) => reminder.patientId === patientId && !reminder.completed,
    );
  },

  getRemindersForDoctor: (doctorId) => {
    return get().reminders.filter(
      (reminder) => reminder.doctorId === doctorId && !reminder.completed,
    );
  },
}));
