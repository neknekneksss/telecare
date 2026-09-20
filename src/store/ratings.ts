"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { ConsultationRating } from "@/lib/types";

interface AddRatingInput {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  feedback?: string;
}

interface RatingsState {
  ratings: ConsultationRating[];

  addRating: (input: AddRatingInput) => ConsultationRating;

  updateRating: (id: string, updates: Partial<ConsultationRating>) => void;

  deleteRating: (id: string) => void;

  getRatingByAppointment: (
    appointmentId: string,
  ) => ConsultationRating | undefined;

  getRatingsForPatient: (patientId: string) => ConsultationRating[];

  getRatingsForDoctor: (doctorId: string) => ConsultationRating[];

  getDoctorAverageRating: (doctorId: string) => number;

  getDoctorRatingCount: (doctorId: string) => number;
}

export const useRatings = create<RatingsState>()(
  persist(
    (set, get) => ({
      ratings: [],

      addRating: (input) => {
        const existing = get().ratings.find(
          (rating) => rating.appointmentId === input.appointmentId,
        );

        /*
         * One rating per consultation.
         *
         * If a rating already exists, update it instead of
         * creating a duplicate.
         */
        if (existing) {
          const updatedRating: ConsultationRating = {
            ...existing,
            rating: Math.min(5, Math.max(1, Math.round(input.rating))),
            feedback: input.feedback?.trim() || undefined,
          };

          set((state) => ({
            ratings: state.ratings.map((rating) =>
              rating.id === existing.id ? updatedRating : rating,
            ),
          }));

          return updatedRating;
        }

        const newRating: ConsultationRating = {
          id: `rating-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          appointmentId: input.appointmentId,
          patientId: input.patientId,
          doctorId: input.doctorId,
          rating: Math.min(5, Math.max(1, Math.round(input.rating))),
          feedback: input.feedback?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          ratings: [...state.ratings, newRating],
        }));

        return newRating;
      },

      updateRating: (id, updates) => {
        set((state) => ({
          ratings: state.ratings.map((rating) =>
            rating.id === id
              ? {
                  ...rating,
                  ...updates,
                  rating:
                    updates.rating !== undefined
                      ? Math.min(5, Math.max(1, Math.round(updates.rating)))
                      : rating.rating,
                  feedback:
                    updates.feedback !== undefined
                      ? updates.feedback.trim() || undefined
                      : rating.feedback,
                }
              : rating,
          ),
        }));
      },

      deleteRating: (id) => {
        set((state) => ({
          ratings: state.ratings.filter((rating) => rating.id !== id),
        }));
      },

      getRatingByAppointment: (appointmentId) => {
        return get().ratings.find(
          (rating) => rating.appointmentId === appointmentId,
        );
      },

      getRatingsForPatient: (patientId) => {
        return get().ratings.filter((rating) => rating.patientId === patientId);
      },

      getRatingsForDoctor: (doctorId) => {
        return get().ratings.filter((rating) => rating.doctorId === doctorId);
      },

      getDoctorAverageRating: (doctorId) => {
        const doctorRatings = get().ratings.filter(
          (rating) => rating.doctorId === doctorId,
        );

        if (doctorRatings.length === 0) {
          return 0;
        }

        const total = doctorRatings.reduce(
          (sum, rating) => sum + rating.rating,
          0,
        );

        return total / doctorRatings.length;
      },

      getDoctorRatingCount: (doctorId) => {
        return get().ratings.filter((rating) => rating.doctorId === doctorId)
          .length;
      },
    }),
    {
      name: "telecare-ratings",
    },
  ),
);
