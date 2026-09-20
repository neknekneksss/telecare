"use client";

import { useSession } from "@/store/session";
import { FloatingMessageButton } from "@/components/FloatingMessages";
import TeleCareHeader from "@/components/TeleCareHeader";

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, userId } = useSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <TeleCareHeader
        role="patient"
        userName="Patient"
        userSubtitle="Patient Portal"
      />

      <main>{children}</main>

      {role === "patient" && userId && (
        <FloatingMessageButton patientId={userId} />
      )}
    </div>
  );
}
