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

    try {
      if (mode === "signup") {
        if (!name.trim() || !cleanEmail || !cleanPassword) {
          setError("Please fill in all required fields.");
          return;
        }

        if (cleanPassword.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
        }

        if (role === "doctor" && (!specialty.trim() || !location.trim())) {
          setError("Please provide your specialty and clinic/location.");
          return;
        }

        if (role === "patient") {
          const existing = await findPatientByEmail(cleanEmail);

          if (existing) {
            setError("A patient account with that email already exists.");
            return;
          }

          const newPatient = await addPatient({
            name: name.trim(),
            email: cleanEmail,
            password: cleanPassword,
          });

          login("patient", newPatient.id);
          router.push("/patient/dashboard");
        } else {
          const existing = await findDoctorByEmail(cleanEmail);

          if (existing) {
            setError("A doctor account with that email already exists.");
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
        return;
      }

      if (role === "patient") {
        const found = await findPatientByEmail(cleanEmail);

        if (!found || found.password !== cleanPassword) {
          setError("Invalid email or password.");
          return;
        }

        login("patient", found.id);
        router.push("/patient/dashboard");
      } else {
        const found = await findDoctorByEmail(cleanEmail);

        if (!found || found.password !== cleanPassword) {
          setError("Invalid email or password.");
          return;
        }

        login("doctor", found.id);
        router.push("/doctor/dashboard");
      }
    } catch (err) {
      console.error("Authentication error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
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

          <span className="text-2xl font-bold text-brand-dark">TeleCare</span>
          <span className="text-sm text-gray-500">Just a Click Away</span>
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Log In
            </button>

            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${
                mode === "signup"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-gray-500"
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              I am a
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRole("patient");
                  setError("");
                }}
                className={`py-3 rounded-xl border text-sm font-semibold transition ${
                  role === "patient"
                    ? "border-brand-dark bg-brand-dark text-white"
                    : "border-gray-200 text-gray-600 hover:border-brand-dark"
                }`}
              >
                Patient
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("doctor");
                  setError("");
                }}
                className={`py-3 rounded-xl border text-sm font-semibold transition ${
                  role === "doctor"
                    ? "border-brand-dark bg-brand-dark text-white"
                    : "border-gray-200 text-gray-600 hover:border-brand-dark"
                }`}
              >
                Practitioner
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Full Name
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-12 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {mode === "signup" && role === "patient" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Date of Birth
                </label>

                <input
                  type="date"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
                />
              </div>
            )}

            {mode === "signup" && role === "doctor" && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Specialty
                  </label>

                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="e.g. Family Medicine"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Clinic / Location
                  </label>

                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. CDO Medical Center"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/10"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-3 text-sm text-red-600">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-brand-dark text-white py-3.5 font-semibold text-sm transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? mode === "signup"
                  ? "Creating account..."
                  : "Logging in..."
                : mode === "signup"
                  ? "Create Account"
                  : "Log In"}
            </button>
          </form>

          {mode === "login" && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDemo((value) => !value)}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-dark transition"
              >
                Demo Access
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    showDemo ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showDemo && (
                <div className="mt-3 rounded-2xl bg-gray-50 border border-gray-100 p-4 space-y-3">
                  <p className="text-xs text-gray-500 text-center">
                    Use a preconfigured account for the presentation.
                  </p>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin("patient")}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-brand-dark hover:text-brand-dark transition"
                  >
                    Demo Patient
                  </button>

                  <button
                    type="button"
                    onClick={() => quickDemoLogin("doctor")}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:border-brand-dark hover:text-brand-dark transition"
                  >
                    Demo Practitioner
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          TeleCare is a prototype for demonstration purposes only.
        </p>
      </div>
    </main>
  );
}
