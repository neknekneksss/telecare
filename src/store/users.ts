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

interface UsersState {
  patients: Patient[];
  doctors: Doctor[];

  loadDoctors: () => Promise<void>;

  addPatient: (input: {
    name: string;
    email?: string;
    dateOfBirth?: string;
    password?: string;
  }) => Patient;

  addDoctor: (input: {
    name: string;
    email?: string;
    specialty: string;
    location: string;
    password?: string;
  }) => Promise<Doctor>;

  findPatientByEmail: (email: string) => Patient | undefined;
  findDoctorByEmail: (email: string) => Doctor | undefined;
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

      addPatient: (input) => {
        const newPatient: Patient = {
          id: `pat-${Date.now()}`,
          avatarColor: randomAvatarColor(),
          name: input.name,
          email: input.email,
          dateOfBirth: input.dateOfBirth,
          password: input.password,
        };

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

      findPatientByEmail: (email) =>
        get().patients.find(
          (patient) => patient.email?.toLowerCase() === email.toLowerCase(),
        ),

      findDoctorByEmail: (email) =>
        get().doctors.find(
          (doctor) => doctor.email?.toLowerCase() === email.toLowerCase(),
        ),
    }),
    {
      name: "telecare-users",
    },
  ),
);
