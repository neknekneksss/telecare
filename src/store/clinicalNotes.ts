"use client";

import { create } from "zustand";
import { ClinicalNote } from "@/lib/types";
import { supabase } from "@/lib/supabase";

interface ClinicalNotesState {
  clinicalNotes: ClinicalNote[];
  isLoading: boolean;

  loadClinicalNotes: () => Promise<void>;

  addClinicalNote: (note: ClinicalNote) => Promise<void>;

  updateClinicalNote: (
    appointmentId: string,
    updates: Partial<ClinicalNote>,
  ) => Promise<void>;

  getClinicalNote: (appointmentId: string) => ClinicalNote | undefined;
}

function mapDatabaseClinicalNote(row: any): ClinicalNote {
  return {
    appointmentId: row.appointment_id,
    vitals: {
      bloodPressure: row.blood_pressure,
      heartRate: Number(row.heart_rate),
      temperature: Number(row.temperature),
    },
    diagnosis: row.diagnosis,
    treatmentPlan: row.treatment_plan,
    doctorNotes: row.doctor_notes ?? undefined,
    icd10Code: row.icd10_code ?? undefined,
  };
}

export const useClinicalNotes = create<ClinicalNotesState>((set, get) => ({
  clinicalNotes: [],
  isLoading: false,

  loadClinicalNotes: async () => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from("clinical_notes")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load clinical notes:", error);
      set({ isLoading: false });
      return;
    }

    const clinicalNotes = (data ?? []).map(mapDatabaseClinicalNote);

    set({
      clinicalNotes,
      isLoading: false,
    });
  },

  addClinicalNote: async (note) => {
    const { error } = await supabase.from("clinical_notes").upsert(
      {
        appointment_id: note.appointmentId,
        blood_pressure: note.vitals.bloodPressure,
        heart_rate: note.vitals.heartRate,
        temperature: note.vitals.temperature,
        diagnosis: note.diagnosis,
        treatment_plan: note.treatmentPlan,
        doctor_notes: note.doctorNotes ?? null,
        icd10_code: note.icd10Code ?? null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "appointment_id",
      },
    );

    if (error) {
      console.error("Failed to save clinical note:", error);

      throw new Error(`Failed to save clinical note: ${error.message}`);
    }

    set((state) => {
      const existing = state.clinicalNotes.find(
        (item) => item.appointmentId === note.appointmentId,
      );

      if (existing) {
        return {
          clinicalNotes: state.clinicalNotes.map((item) =>
            item.appointmentId === note.appointmentId ? note : item,
          ),
        };
      }

      return {
        clinicalNotes: [...state.clinicalNotes, note],
      };
    });
  },

  updateClinicalNote: async (appointmentId, updates) => {
    const existing = get().clinicalNotes.find(
      (note) => note.appointmentId === appointmentId,
    );

    if (!existing) {
      throw new Error("Cannot update clinical note because it does not exist.");
    }

    const updatedNote: ClinicalNote = {
      ...existing,
      ...updates,
      vitals: {
        ...existing.vitals,
        ...(updates.vitals ?? {}),
      },
    };

    const { error } = await supabase
      .from("clinical_notes")
      .update({
        blood_pressure: updatedNote.vitals.bloodPressure,
        heart_rate: updatedNote.vitals.heartRate,
        temperature: updatedNote.vitals.temperature,
        diagnosis: updatedNote.diagnosis,
        treatment_plan: updatedNote.treatmentPlan,
        doctor_notes: updatedNote.doctorNotes ?? null,
        icd10_code: updatedNote.icd10Code ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("appointment_id", appointmentId);

    if (error) {
      console.error("Failed to update clinical note:", error);

      throw new Error(`Failed to update clinical note: ${error.message}`);
    }

    set((state) => ({
      clinicalNotes: state.clinicalNotes.map((note) =>
        note.appointmentId === appointmentId ? updatedNote : note,
      ),
    }));
  },

  getClinicalNote: (appointmentId) => {
    return get().clinicalNotes.find(
      (note) => note.appointmentId === appointmentId,
    );
  },
}));
