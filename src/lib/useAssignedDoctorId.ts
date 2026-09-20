import { useMemo } from "react";
import { appointments } from "@/lib/mock-data/appointments";
import { useUsers } from "@/store/users";

/**
 * Picks the doctor a patient's chat conversation is with: their nearest
 * upcoming appointment's doctor, falling back to their most recent
 * appointment, falling back to the first doctor in the system.
 * This is a simplification for the prototype — a real app would let
 * a patient message any doctor they've ever seen, or pick from a list.
 */
export function useAssignedDoctorId(patientId: string | null): string | null {
  const doctors = useUsers((s) => s.doctors);

  return useMemo(() => {
    if (!patientId) return null;

    const mine = appointments
      .filter((a) => a.patientId === patientId)
      .sort(
        (a, b) =>
          new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
      );

    const upcoming = mine.find((a) => a.status === "upcoming");
    if (upcoming) return upcoming.doctorId;

    if (mine.length > 0) return mine[mine.length - 1].doctorId;

    return doctors[0]?.id ?? null;
  }, [patientId, doctors]);
}
