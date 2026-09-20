export type Role = "patient" | "doctor";

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  avatarColor: string;
  availableSlots: string[];
  consultationFee?: number;
  phone?: string;
  email?: string;
  password?: string;
}

export interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  avatarColor: string;
  email?: string;
  password?: string;
}

export type AppointmentStatus =
  | "upcoming"
  | "completed"
  | "cancelled"
  | "in-progress";

export interface TriageIntake {
  symptoms: string[];
  symptomDuration: string;
  existingConditions: string;
  currentMedications: string;
  allergies: string;
  additionalNotes: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  dateTime: string;
  status: AppointmentStatus;
  reasonForVisit: string;
  urgency: "low" | "medium" | "high";
  consultationFee?: number;
  triage?: TriageIntake;
}

export interface ClinicalNote {
  appointmentId: string;
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
  };
  diagnosis: string;
  treatmentPlan: string;
  doctorNotes?: string;
  icd10Code?: string;
}

export type FollowUpStatus = "scheduled" | "completed" | "cancelled";

export interface FollowUp {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  scheduledFor: string;
  reason: string;
  notes?: string;
  status: FollowUpStatus;
  createdAt: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  appointmentId: string;
  medication: string;
  dosage: string;
  schedule: string;
  nextDose: string;
  refillRemindAt?: string;
}

export interface MedicationLog {
  id: string;
  prescriptionId: string;
  scheduledFor: string;
  takenAt?: string;
}

export interface ChatMessage {
  id: string;
  patientId: string;
  doctorId: string;
  sender: Role;
  text: string;
  createdAt: string;
}

export interface ConsultationRating {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  feedback?: string;
  createdAt: string;
}
