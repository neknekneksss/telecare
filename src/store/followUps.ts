"use client";

import { create } from "zustand";

import { supabase } from "@/lib/supabase";
import { FollowUp, FollowUpStatus } from "@/lib/types";

interface FollowUpsState {
  followUps: FollowUp[];
  isLoading: boolean;

  loadFollowUps: () => Promise<void>;

  addFollowUp: (followUp: FollowUp) => Promise<void>;

  updateFollowUp: (id: string, updates: Partial<FollowUp>) => Promise<void>;

  getFollowUp: (id: string) => FollowUp | undefined;

  getFollowUpsForPatient: (patientId: string) => FollowUp[];

  getFollowUpsForDoctor: (doctorId: string) => FollowUp[];

  getFollowUpsForAppointment: (appointmentId: string) => FollowUp[];

  updateStatus: (id: string, status: FollowUpStatus) => Promise<void>;

  removeFollowUp: (id: string) => Promise<void>;
}

function mapDatabaseFollowUp(row: any): FollowUp {
  return {
    id: row.id,
    patientId: row.patient_id,
    doctorId: row.doctor_id,
    appointmentId: row.appointment_id,
    scheduledFor: row.scheduled_for,
    reason: row.reason,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.created_at,
  };
}

export const useFollowUps = create<FollowUpsState>((set, get) => ({
  followUps: [],
  isLoading: false,

  loadFollowUps: async () => {
    set({ isLoading: true });

    const { data, error } = await supabase
      .from("follow_ups")
      .select("*")
      .order("scheduled_for", {
        ascending: true,
      });

    if (error) {
      console.error("Failed to load follow-ups:", error);

      set({ isLoading: false });
      return;
    }

    set({
      followUps: (data ?? []).map(mapDatabaseFollowUp),
      isLoading: false,
    });
  },

  addFollowUp: async (followUp) => {
    const { error } = await supabase.from("follow_ups").upsert(
      {
        id: followUp.id,
        patient_id: followUp.patientId,
        doctor_id: followUp.doctorId,
        appointment_id: followUp.appointmentId,
        scheduled_for: followUp.scheduledFor,
        reason: followUp.reason,
        notes: followUp.notes ?? null,
        status: followUp.status,
        created_at: followUp.createdAt,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    );

    if (error) {
      console.error("Failed to save follow-up:", error);

      throw new Error(`Failed to save follow-up: ${error.message}`);
    }

    set((state) => {
      const existing = state.followUps.find((item) => item.id === followUp.id);

      if (existing) {
        return {
          followUps: state.followUps.map((item) =>
            item.id === followUp.id ? followUp : item,
          ),
        };
      }

      return {
        followUps: [...state.followUps, followUp],
      };
    });
  },

  updateFollowUp: async (id, updates) => {
    const existing = get().followUps.find((followUp) => followUp.id === id);

    if (!existing) {
      throw new Error("Cannot update follow-up because it does not exist.");
    }

    const updatedFollowUp: FollowUp = {
      ...existing,
      ...updates,
    };

    const { error } = await supabase
      .from("follow_ups")
      .update({
        patient_id: updatedFollowUp.patientId,
        doctor_id: updatedFollowUp.doctorId,
        appointment_id: updatedFollowUp.appointmentId,
        scheduled_for: updatedFollowUp.scheduledFor,
        reason: updatedFollowUp.reason,
        notes: updatedFollowUp.notes ?? null,
        status: updatedFollowUp.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update follow-up:", error);

      throw new Error(`Failed to update follow-up: ${error.message}`);
    }

    set((state) => ({
      followUps: state.followUps.map((followUp) =>
        followUp.id === id ? updatedFollowUp : followUp,
      ),
    }));
  },

  getFollowUp: (id) => {
    return get().followUps.find((followUp) => followUp.id === id);
  },

  getFollowUpsForPatient: (patientId) => {
    return get().followUps.filter(
      (followUp) => followUp.patientId === patientId,
    );
  },

  getFollowUpsForDoctor: (doctorId) => {
    return get().followUps.filter((followUp) => followUp.doctorId === doctorId);
  },

  getFollowUpsForAppointment: (appointmentId) => {
    return get().followUps.filter(
      (followUp) => followUp.appointmentId === appointmentId,
    );
  },

  updateStatus: async (id, status) => {
    const { error } = await supabase
      .from("follow_ups")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Failed to update follow-up status:", error);

      throw new Error(`Failed to update follow-up status: ${error.message}`);
    }

    set((state) => ({
      followUps: state.followUps.map((followUp) =>
        followUp.id === id
          ? {
              ...followUp,
              status,
            }
          : followUp,
      ),
    }));
  },

  removeFollowUp: async (id) => {
    const { error } = await supabase.from("follow_ups").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete follow-up:", error);

      throw new Error(`Failed to delete follow-up: ${error.message}`);
    }

    set((state) => ({
      followUps: state.followUps.filter((followUp) => followUp.id !== id),
    }));
  },
}));
