"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Doctor, Patient } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { doctors as seedDoctors } from "@/lib/mock-data/doctors";
import { patients as seedPatients } from "@/lib/mock-data/patients";

const AVATAR_COLORS = ["#114084", "#3566AB", "#83B7DE", "#808080"];

function randomAvatarColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function createDefaultDoctorSlots() {
  const slots: string[] = [];
  const now = new Date();

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const morning = new Date(now);
    morning.setDate(now.getDate() + dayOffset);
    morning.setHours(9, 0, 0, 0);

    const afternoon = new Date(now);
    afternoon.setDate(now.getDate() + dayOffset);
    afternoon.setHours(14, 0, 0, 0);

    slots.push(morning.toISOString());
    slots.push(afternoon.toISOString());
  }

  return slots;
}

function mapDatabaseDoctor(row: any): Doctor {
  return {
    id: row.id,
    avatarColor: row.avatar_color ?? randomAvatarColor(),
    name: row.name,
    email: row.email ?? undefined,
    specialty: row.specialty,
    location: row.location,
    password: row.password ?? undefined,
    availableSlots: Array.isArray(row.available_slots)
      ? row.available_slots
      : createDefaultDoctorSlots(),
  };
}

function mapDatabasePatient(row: any): Patient {
  return {
    id: row.id,
    avatarColor: row.avatar_color ?? randomAvatarColor(),
    name: row.name,
    email: row.email ?? undefined,
    password: row.password ?? undefined,
    dateOfBirth: row.date_of_birth ?? undefined,
  };
}

interface UsersState {
  patients: Patient[];
  doctors: Doctor[];

  loadDoctors: () => Promise<void>;

  addPatient: (input: {
    name: string;
    email?: string;
    dateOfBirth?: string;
    password?: string;
  }) => Promise<Patient>;

  addDoctor: (input: {
    name: string;
    email?: string;
    specialty: string;
    location: string;
    password?: string;
  }) => Promise<Doctor>;

  findPatientByEmail: (email: string) => Promise<Patient | undefined>;
  findDoctorByEmail: (email: string) => Promise<Doctor | undefined>;
}

export const useUsers = create<UsersState>()(
  persist(
    (set, get) => ({
      patients: seedPatients,
      doctors: seedDoctors,

      loadDoctors: async () => {
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .order("name", { ascending: true });

        if (error) {
          console.error("Failed to load doctors:", error);
          return;
        }

        const databaseDoctors = (data ?? []).map(mapDatabaseDoctor);

        const combinedDoctors = [...seedDoctors, ...databaseDoctors];

        const uniqueDoctors = Array.from(
          new Map(
            combinedDoctors.map((doctor) => [doctor.id, doctor]),
          ).values(),
        );

        set({
          doctors: uniqueDoctors,
        });
      },

      addPatient: async (input) => {
        const newPatient: Patient = {
          id: `pat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          avatarColor: randomAvatarColor(),
          name: input.name,
          email: input.email,
          dateOfBirth: input.dateOfBirth,
          password: input.password,
        };

        const { error } = await supabase.from("patients").insert({
          id: newPatient.id,
          name: newPatient.name,
          email: newPatient.email ?? null,
          password: newPatient.password ?? null,
          date_of_birth: newPatient.dateOfBirth ?? null,
          avatar_color: newPatient.avatarColor,
        });

        if (error) {
          console.error("Failed to create patient:", error);
          throw new Error(`Failed to create patient: ${error.message}`);
        }

        set((state) => ({
          patients: [...state.patients, newPatient],
        }));

        return newPatient;
      },

      addDoctor: async (input) => {
        const newDoctor: Doctor = {
          id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          avatarColor: randomAvatarColor(),
          availableSlots: createDefaultDoctorSlots(),
          name: input.name,
          email: input.email,
          specialty: input.specialty,
          location: input.location,
          password: input.password,
        };

        const { error } = await supabase.from("doctors").insert({
          id: newDoctor.id,
          name: newDoctor.name,
          email: newDoctor.email ?? null,
          specialty: newDoctor.specialty,
          location: newDoctor.location,
          password: newDoctor.password ?? null,
          avatar_color: newDoctor.avatarColor,
          available_slots: newDoctor.availableSlots,
        });

        if (error) {
          console.error("Failed to create doctor:", error);
          throw new Error(`Failed to create doctor: ${error.message}`);
        }

        set((state) => ({
          doctors: [...state.doctors, newDoctor],
        }));

        return newDoctor;
      },

      findPatientByEmail: async (email) => {
        // Keep seeded/demo patients local.
        const localPatient = get().patients.find(
          (patient) => patient.email?.toLowerCase() === email.toLowerCase(),
        );

        if (localPatient) {
          return localPatient;
        }

        // Fall back to Supabase for newly created accounts.
        const { data, error } = await supabase
          .from("patients")
          .select("*")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error("Failed to find patient:", error);
          return undefined;
        }

        if (!data) {
          return undefined;
        }

        const patient = mapDatabasePatient(data);

        // Cache the account locally after finding it.
        set((state) => {
          const exists = state.patients.some(
            (existing) => existing.id === patient.id,
          );

          return exists ? state : { patients: [...state.patients, patient] };
        });

        return patient;
      },

      findDoctorByEmail: async (email) => {
        // Keep seeded/demo doctors local.
        const localDoctor = get().doctors.find(
          (doctor) => doctor.email?.toLowerCase() === email.toLowerCase(),
        );

        if (localDoctor) {
          return localDoctor;
        }

        // Fall back to Supabase for newly created accounts.
        const { data, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (error) {
          console.error("Failed to find doctor:", error);
          return undefined;
        }

        if (!data) {
          return undefined;
        }

        const doctor = mapDatabaseDoctor(data);

        set((state) => {
          const exists = state.doctors.some(
            (existing) => existing.id === doctor.id,
          );

          return exists ? state : { doctors: [...state.doctors, doctor] };
        });

        return doctor;
      },
    }),
    {
      name: "telecare-users",
    },
  ),
);
