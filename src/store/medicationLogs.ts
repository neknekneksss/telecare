"use client";

import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { MedicationLog } from "@/lib/types";

interface MedicationLogsState {
  medicationLogs: MedicationLog[];
  isLoading: boolean;

  loadMedicationLogs: () => Promise<void>;

  logDose: (
    prescriptionId: string,
    scheduledFor: string,
    takenAt?: string,
  ) => Promise<void>;

  removeDoseLog: (
    prescriptionId: string,
    scheduledFor: string,
  ) => Promise<void>;

  getLogsForPrescription: (prescriptionId: string) => MedicationLog[];

  getLogForDose: (
    prescriptionId: string,
    scheduledFor: string,
  ) => MedicationLog | undefined;

  isDoseTaken: (prescriptionId: string, scheduledFor: string) => boolean;
}

/**
 * Normalizes a timestamp so the same moment always has
 * the same ISO string representation in the client state.
 */
function normalizeTimestamp(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString();
}

function mapDatabaseMedicationLog(row: any): MedicationLog {
  return {
    id: row.id,
    prescriptionId: row.prescription_id,
    scheduledFor: normalizeTimestamp(row.scheduled_for) ?? row.scheduled_for,
    takenAt: normalizeTimestamp(row.taken_at),
  };
}

export const useMedicationLogs = create<MedicationLogsState>((set, get) => ({
  medicationLogs: [],
  isLoading: false,

  loadMedicationLogs: async () => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from("medication_logs")
      .select("*")
      .order("scheduled_for", {
        ascending: true,
      });

    if (error) {
      console.error("Failed to load medication logs:", error);

      set({ isLoading: false });
      return;
    }

    set({
      medicationLogs: (data ?? []).map(mapDatabaseMedicationLog),
      isLoading: false,
    });
  },

  logDose: async (
    prescriptionId,
    scheduledFor,
    takenAt = new Date().toISOString(),
  ) => {
    const normalizedScheduledFor =
      normalizeTimestamp(scheduledFor) ?? scheduledFor;

    const normalizedTakenAt = normalizeTimestamp(takenAt) ?? takenAt;

    const existingLog = get().medicationLogs.find(
      (log) =>
        log.prescriptionId === prescriptionId &&
        normalizeTimestamp(log.scheduledFor) === normalizedScheduledFor,
    );

    const logId =
      existingLog?.id ??
      `med-log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await supabase
      .from("medication_logs")
      .upsert(
        {
          id: logId,
          prescription_id: prescriptionId,
          scheduled_for: normalizedScheduledFor,
          taken_at: normalizedTakenAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "prescription_id,scheduled_for",
        },
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to log medication dose:", error);

      throw new Error(`Failed to log medication dose: ${error.message}`);
    }

    const savedLog = mapDatabaseMedicationLog(data);

    set((state) => {
      const alreadyExists = state.medicationLogs.some(
        (log) => log.id === savedLog.id,
      );

      if (alreadyExists) {
        return {
          medicationLogs: state.medicationLogs.map((log) =>
            log.id === savedLog.id ? savedLog : log,
          ),
        };
      }

      return {
        medicationLogs: [...state.medicationLogs, savedLog],
      };
    });
  },

  removeDoseLog: async (prescriptionId, scheduledFor) => {
    const normalizedScheduledFor =
      normalizeTimestamp(scheduledFor) ?? scheduledFor;

    const { error } = await supabase
      .from("medication_logs")
      .delete()
      .eq("prescription_id", prescriptionId)
      .eq("scheduled_for", normalizedScheduledFor);

    if (error) {
      console.error("Failed to remove medication dose log:", error);

      throw new Error(`Failed to remove medication dose log: ${error.message}`);
    }

    set((state) => ({
      medicationLogs: state.medicationLogs.filter(
        (log) =>
          !(
            log.prescriptionId === prescriptionId &&
            normalizeTimestamp(log.scheduledFor) === normalizedScheduledFor
          ),
      ),
    }));
  },

  getLogsForPrescription: (prescriptionId) => {
    return get().medicationLogs.filter(
      (log) => log.prescriptionId === prescriptionId,
    );
  },

  getLogForDose: (prescriptionId, scheduledFor) => {
    const normalizedScheduledFor =
      normalizeTimestamp(scheduledFor) ?? scheduledFor;

    return get().medicationLogs.find(
      (log) =>
        log.prescriptionId === prescriptionId &&
        normalizeTimestamp(log.scheduledFor) === normalizedScheduledFor,
    );
  },

  isDoseTaken: (prescriptionId, scheduledFor) => {
    const normalizedScheduledFor =
      normalizeTimestamp(scheduledFor) ?? scheduledFor;

    const log = get().medicationLogs.find(
      (entry) =>
        entry.prescriptionId === prescriptionId &&
        normalizeTimestamp(entry.scheduledFor) === normalizedScheduledFor,
    );

    return Boolean(log?.takenAt);
  },
}));
