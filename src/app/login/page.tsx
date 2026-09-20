"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  HeartPulse,
} from "lucide-react";
import { useSession } from "@/store/session";
import { useUsers } from "@/store/users";
import { Role } from "@/lib/types";

type Mode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();

  const login = useSession((s) => s.login);

  const {
    patients,
    doctors,
    addPatient,
    addDoctor,
    findPatientByEmail,
    findDoctorByEmail,
  } = useUsers();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("patient");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 10);
    return () => clearTimeout(t);
  }, []);

  function resetForm() {
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setSpecialty("");
    setLocation("");
    setError("");
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    if (mode === "signup") {
      if (!name.trim() || !cleanEmail || !cleanPassword) {
        setError("Please fill in all required fields.");
        setIsSubmitting(false);
        return;
      }

      if (cleanPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        setIsSubmitting(false);
        return;
      }

      if (role === "doctor" && (!specialty.trim() || !location.trim())) {
        setError("Please provide your specialty and clinic/location.");
        setIsSubmitting(false);
        return;
      }

      if (role === "patient") {
        const existing = findPatientByEmail(cleanEmail);

        if (existing) {
          setError("A patient account with that email already exists.");
          setIsSubmitting(false);
          return;
        }

        const newPatient = addPatient({
          name: name.trim(),
          email: cleanEmail,
          password: cleanPassword,
        });

        login("patient", newPatient.id);
        router.push("/patient/dashboard");
      } else {
        const existing = findDoctorByEmail(cleanEmail);

        if (existing) {
          setError("A doctor account with that email already exists.");
          setIsSubmitting(false);
          return;
        }

        const newDoctor = await addDoctor({
          name: name.trim(),
          email: cleanEmail,
          password: cleanPassword,
          specialty: specialty.trim(),
          location: location.trim(),
        });

        login("doctor", newDoctor.id);
        router.push("/doctor/dashboard");
      }

      return;
    }

    if (!cleanEmail || !cleanPassword) {
      setError("Enter your email and password.");
      setIsSubmitting(false);
      return;
    }

    if (role === "patient") {
      const found = findPatientByEmail(cleanEmail);

      if (!found || found.password !== cleanPassword) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      login("patient", found.id);
      router.push("/patient/dashboard");
    } else {
      const found = findDoctorByEmail(cleanEmail);

      if (!found || found.password !== cleanPassword) {
        setError("Invalid email or password.");
        setIsSubmitting(false);
        return;
      }

      login("doctor", found.id);
      router.push("/doctor/dashboard");
    }
  }

  function quickDemoLogin(quickRole: Role) {
    if (quickRole === "patient") {
      login("patient", patients[0].id);
      router.push("/patient/dashboard");
    } else {
      login("doctor", doctors[1].id);
      router.push("/doctor/dashboard");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center px-6 py-16 gap-8">
      <div
        className={`w-full max-w-md transition-all duration-500 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <Link href="/" className="flex flex-col items-center gap-2 mb-6 group">
          <span className="w-11 h-11 rounded-2xl bg-brand-dark text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <HeartPulse size={20} />
          </span>
          <span className="text-sm font-semibold text-neutral-ink">
            Telecare
          </span>
        </Link>

        <div className="bg-white border border-neutral-off rounded-2xl shadow-sm px-6 py-8">
          <h1 className="text-2xl font-semibold text-brand-dark text-center">
            {mode === "login" ? "Log in to Telecare" : "Create your account"}
          </h1>

          <div className="relative mt-6 flex bg-neutral-off rounded-xl p-1">
            <div
              className={`absolute top-1 bottom-1 left-1 rounded-lg bg-white shadow transition-transform duration-300 ease-out ${
                mode === "signup" ? "translate-x-full" : "translate-x-0"
              }`}
              style={{ width: "calc(50% - 4px)" }}
            />

            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`relative z-10 flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "login" ? "text-brand-dark" : "text-neutral-mid"
              }`}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`relative z-10 flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === "signup" ? "text-brand-dark" : "text-neutral-mid"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {(["patient", "doctor"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                  role === r
                    ? "border-brand bg-brand-light/20 text-brand-dark"
                    : "border-neutral-off text-neutral-mid hover:border-brand-light"
                }`}
              >
                {r === "patient" ? "Patient" : "Doctor"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div
              className={`grid transition-all duration-300 ease-out ${
                mode === "signup"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden -m-1 p-1">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-neutral-mid mb-1"
                >
                  Full name
                </label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-off bg-neutral-off/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder="Juana dela Cruz"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-mid mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-off bg-neutral-off/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-neutral-mid mb-1"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-11 border border-neutral-off bg-neutral-off/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                  placeholder={
                    mode === "signup"
                      ? "At least 6 characters"
                      : "Enter your password"
                  }
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-mid hover:text-brand-dark transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              className={`grid transition-all duration-300 ease-out ${
                mode === "signup" && role === "doctor"
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden -m-1 p-1 space-y-4">
                <div>
                  <label
                    htmlFor="specialty"
                    className="block text-xs font-medium text-neutral-mid mb-1"
                  >
                    Specialty
                  </label>

                  <input
                    id="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-off bg-neutral-off/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="General Medicine"
                  />
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-xs font-medium text-neutral-mid mb-1"
                  >
                    Clinic / Location
                  </label>

                  <input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-off bg-neutral-off/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                    placeholder="Bukidnon Family Medical Center"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-medium py-3 rounded-xl transition-all duration-200"
            >
              {isSubmitting
                ? mode === "login"
                  ? "Logging in…"
                  : "Creating account…"
                : mode === "login"
                  ? "Log In"
                  : "Create Account"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-neutral-off">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-xs text-neutral-mid hover:text-brand-dark transition-colors"
            >
              <span>Demo access</span>
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${
                  showDemo ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              className={`grid transition-all duration-300 ease-out ${
                showDemo
                  ? "grid-rows-[1fr] opacity-100 mt-3"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="text-xs text-neutral-mid mb-3 text-center">
                  Skip the form and demo as a seeded account
                </p>

                <div className="flex justify-center gap-3 pb-1">
                  <button
                    type="button"
                    onClick={() => quickDemoLogin("patient")}
                    className="text-xs border border-brand text-brand-dark px-3 py-1.5 rounded-lg hover:bg-neutral-off transition-colors"
                  >
                    Quick demo: Patient
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin("doctor")}
                    className="text-xs border border-brand text-brand-dark px-3 py-1.5 rounded-lg hover:bg-neutral-off transition-colors"
                  >
                    Quick demo: Doctor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
