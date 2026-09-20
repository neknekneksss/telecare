import { Appointment } from "@/lib/types";

export const appointments: Appointment[] = [
  {
    id: "appt-1",
    patientId: "pat-1",
    doctorId: "doc-1",
    dateTime: "2026-09-22T09:00:00+08:00",
    status: "upcoming",
    reasonForVisit: "Persistent mild headache, 3 days",
    urgency: "medium",
  },
  {
    id: "appt-2",
    patientId: "pat-2",
    doctorId: "doc-2",
    dateTime: "2026-09-18T10:00:00+08:00",
    status: "completed",
    reasonForVisit: "Routine child checkup",
    urgency: "low",
  },
];
