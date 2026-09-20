"use client";

import { create } from "zustand";

import { Prescription } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface AddPrescriptionInput {
  patientId: string;
  appointmentId: string;
  medication: string;
  dosage: string;
  schedule: string;
  nextDose: string;
  refillRemindAt?: string;
}

interface PrescriptionsState {
  prescriptions: Prescription[];
  isLoading: boolean;

  loadPrescriptions: () => Promise<void>;

  addPrescription: (input: AddPrescriptionInput) => Promise<Prescription>;

  updatePrescription: (
    id: string,
    updates: Partial<Prescription>,
  ) => Promise<void>;

  deletePrescription: (id: string) => Promise<void>;

  getPrescriptionById: (id: string) => Prescription | undefined;

  getPatientPrescriptions: (patientId: string) => Prescription[];

  getAppointmentPrescription: (
    appointmentId: string,
  ) => Prescription | undefined;
}

function mapDatabasePrescription(row: any): Prescription {
  return {
    id: row.id,
    patientId: row.patient_id,
    appointmentId: row.appointment_id,
    medication: row.medication,
    dosage: row.dosage,
    schedule: row.schedule,
    nextDose: row.next_dose,
    refillRemindAt: row.refill_remind_at ?? undefined,
  };
}

export const usePrescriptions = create<PrescriptionsState>((set, get) => ({
  prescriptions: [],
  isLoading: false,

  loadPrescriptions: async () => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load prescriptions:", error);
      set({ isLoading: false });
      return;
    }

    set({
      prescriptions: (data ?? []).map(mapDatabasePrescription),
      isLoading: false,
    });
  },

  addPrescription: async (input) => {
    const existing = get().prescriptions.find(
      (prescription) => prescription.appointmentId === input.appointmentId,
    );

    const prescription: Prescription = {
      id: existing?.id ?? `rx-${Date.now()}`,
      patientId: input.patientId,
      appointmentId: input.appointmentId,
      medication: input.medication,
      dosage: input.dosage,
      schedule: input.schedule,
      nextDose: input.nextDose,
      refillRemindAt: input.refillRemindAt,
    };

    const { error } = await supabase.from("prescriptions").upsert(
      {
        id: prescription.id,
        patient_id: prescription.patientId,
        appointment_id: prescription.appointmentId,
        medication: prescription.medication,
        dosage: prescription.dosage,
        schedule: prescription.schedule,
        next_dose: prescription.nextDose,
        refill_remind_at: prescription.refillRemindAt ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "appointment_id",
      },
    );

    if (error) {
      console.error("Failed to save prescription:", error);

      throw new Error(`Failed to save prescription: ${error.message}`);
    }

    set((state) => {
      const alreadyExists = state.prescriptions.some(
        (item) => item.id === prescription.id,
      );

      if (alreadyExists) {
        return {
          prescriptions: state.prescriptions.map((item) =>
            item.id === prescription.id ? prescription : item,
          ),
        };
      }

      return {
        prescriptions: [...state.prescriptions, prescription],
      };
    });

    return prescription;
  },

  updatePrescription: async (id, updates) => {
    const existing = get().prescriptions.find(
      (prescription) => prescription.id === id,
    );

    if (!existing) {
      throw new Error("Cannot update prescription because it does not exist.");
    }

    const updatedPrescription: Prescription = {
      ...existing,
      ...updates,
    };

    const { error } = await supabase
      .from("prescriptions")
      .update({
        patient_id: updatedPrescription.patientId,
        appointment_id: updatedPrescription.appointmentId,
        medication: updatedPrescription.medication,
        dosage: updatedPrescription.dosage,
        schedule: updatedPrescription.schedule,
        next_dose: updatedPrescription.nextDose,
        refill_remind_at: updatedPrescription.refillRemindAt ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update prescription:", error);

      throw new Error(`Failed to update prescription: ${error.message}`);
    }

    set((state) => ({
      prescriptions: state.prescriptions.map((prescription) =>
        prescription.id === id ? updatedPrescription : prescription,
      ),
    }));
  },

  deletePrescription: async (id) => {
    const { error } = await supabase
      .from("prescriptions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete prescription:", error);

      throw new Error(`Failed to delete prescription: ${error.message}`);
    }

    set((state) => ({
      prescriptions: state.prescriptions.filter(
        (prescription) => prescription.id !== id,
      ),
    }));
  },

  getPrescriptionById: (id) => {
    return get().prescriptions.find((prescription) => prescription.id === id);
  },

  getPatientPrescriptions: (patientId) => {
    return get().prescriptions.filter(
      (prescription) => prescription.patientId === patientId,
    );
  },

  getAppointmentPrescription: (appointmentId) => {
    return get().prescriptions.find(
      (prescription) => prescription.appointmentId === appointmentId,
    );
  },
}));
