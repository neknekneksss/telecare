"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Crosshair,
  Hospital,
  Loader2,
  MapPin,
  Search,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";

const BukidnonMap = dynamic(() => import("@/components/maps/BukidnonMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">
      Loading map...
    </div>
  ),
});

type FacilityType = "Hospital" | "Clinic";

type Facility = {
  id: string;
  name: string;
  type: FacilityType;
  city: string;
  latitude: number;
  longitude: number;
};

type UserLocation = {
  latitude: number;
  longitude: number;
};

const CMU_LOCATION: UserLocation = {
  latitude: 7.85826707096227,
  longitude: 125.04761833703593,
};

const FACILITIES: Facility[] = [
  {
    id: "cmu-hospital",
    name: "Central Mindanao University Hospital",
    type: "Hospital",
    city: "Musuan, Maramag",
    latitude: 7.85826707096227,
    longitude: 125.04761833703593,
  },
  {
    id: "bph-maramag",
    name: "Bukidnon Provincial Hospital - Maramag",
    type: "Hospital",
    city: "Maramag",
    latitude: 7.76472,
    longitude: 125.00872,
  },
  {
    id: "st-joseph-maramag",
    name: "St. Joseph Southern Bukidnon Hospital",
    type: "Hospital",
    city: "Maramag",
    latitude: 7.77332,
    longitude: 125.00953,
  },
  {
    id: "bongcas-holy-child",
    name: "Bongcas Holy Child Hospital",
    type: "Hospital",
    city: "Maramag",
    latitude: 7.7655,
    longitude: 125.0095,
  },
  {
    id: "adventist-valencia",
    name: "Adventist Medical Center - Valencia City",
    type: "Hospital",
    city: "Valencia City",
    latitude: 7.91231,
    longitude: 125.0923,
  },
  {
    id: "valencia-polymedic",
    name: "Valencia Polymedic General Hospital",
    type: "Hospital",
    city: "Valencia City",
    latitude: 7.91478,
    longitude: 125.09211,
  },
  {
    id: "valencia-medical",
    name: "Valencia Medical Hospital",
    type: "Hospital",
    city: "Valencia City",
    latitude: 7.91141,
    longitude: 125.09267,
  },
  {
    id: "lavina-general",
    name: "Laviña General Hospital",
    type: "Hospital",
    city: "Valencia City",
    latitude: 7.9080079478779375,
    longitude: 125.09259677611269,
  },
  {
    id: "blanco-clinic",
    name: "BLANCO CLINIC GENERAL HOSPITAL",
    type: "Clinic",
    city: "Valencia City",
    latitude: 7.9029,
    longitude: 125.0919,
  },
  {
    id: "medidas-medical",
    name: "Medidas Medical Center",
    type: "Hospital",
    city: "Valencia City",
    latitude: 7.90494,
    longitude: 125.08461,
  },
  {
    id: "esther-hospital",
    name: "Esther Hospital",
    type: "Hospital",
    city: "Valencia City",
    latitude: 7.898454149317041,
    longitude: 125.08819095156717,
  },
  {
    id: "bpmc-malaybalay",
    name: "Bukidnon Provincial Medical Center",
    type: "Hospital",
    city: "Malaybalay City",
    latitude: 8.12797,
    longitude: 125.1295,
  },
  {
    id: "malaybalay-polymedic",
    name: "Malaybalay Polymedic General Hospital",
    type: "Hospital",
    city: "Malaybalay City",
    latitude: 8.14887,
    longitude: 125.1319,
  },
  {
    id: "bethel-baptist",
    name: "Bethel Baptist Hospital",
    type: "Hospital",
    city: "Malaybalay City",
    latitude: 8.15972,
    longitude: 125.12155,
  },
  {
    id: "st-jude-malaybalay",
    name: "St. Jude Thaddeus General Hospital",
    type: "Hospital",
    city: "Malaybalay City",
    latitude: 8.15495,
    longitude: 125.12959,
  },
  {
    id: "malaybalay-medical",
    name: "Malaybalay Medical Hospital",
    type: "Hospital",
    city: "Malaybalay City",
    latitude: 8.15239,
    longitude: 125.12949,
  },
  {
    id: "phillips-memorial",
    name: "Phillips Memorial Hospital",
    type: "Hospital",
    city: "Manolo Fortich",
    latitude: 8.32575,
    longitude: 124.81723,
  },
  {
    id: "bph-manolo-fortich",
    name: "Bukidnon Provincial Hospital - Manolo Fortich",
    type: "Hospital",
    city: "Manolo Fortich",
    latitude: 8.38493,
    longitude: 124.83906,
  },
  {
    id: "abc-animal-bite",
    name: "ABC Doctors Animal Bite Center",
    type: "Clinic",
    city: "Manolo Fortich",
    latitude: 8.36748,
    longitude: 124.86605,
  },
  {
    id: "don-carlos-doctors",
    name: "Don Carlos Doctors Hospital",
    type: "Hospital",
    city: "Don Carlos",
    latitude: 7.67952,
    longitude: 124.99602,
  },
  {
    id: "simbulan-sto-nino",
    name: "Simbulan Sto. Nino General Hospital",
    type: "Hospital",
    city: "Don Carlos",
    latitude: 7.682,
    longitude: 125.0,
  },
  {
    id: "bph-kibawe",
    name: "Bukidnon Provincial Hospital - Kibawe",
    type: "Hospital",
    city: "Kibawe",
    latitude: 7.57161,
    longitude: 124.99196,
  },
  {
    id: "bph-talakag",
    name: "Bukidnon Provincial Hospital - Talakag",
    type: "Hospital",
    city: "Talakag",
    latitude: 8.23211,
    longitude: 124.59916,
  },
  {
    id: "maraat-medical",
    name: "Maraat Medical Hospital",
    type: "Hospital",
    city: "Quezon",
    latitude: 7.7309,
    longitude: 125.1,
  },
];

function haversineDistanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadiusKm = 6371;

  const latitudeDifference = ((latitude2 - latitude1) * Math.PI) / 180;
  const longitudeDifference = ((longitude2 - longitude1) * Math.PI) / 180;

  const lat1Radians = (latitude1 * Math.PI) / 180;
  const lat2Radians = (latitude2 * Math.PI) / 180;

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(lat1Radians) *
      Math.cos(lat2Radians) *
      Math.sin(longitudeDifference / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function formatDistance(distanceKm: number) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

export default function NearbyCarePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>();

  const [userLocation, setUserLocation] = useState<UserLocation>(CMU_LOCATION);

  const [usingGps, setUsingGps] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        setUserLocation(location);
        setUsingGps(true);
        setLocating(false);
        setLocationError("");
        setSelectedFacilityId(undefined);
      },
      (error) => {
        setLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location permission was denied. You can still use the CMU demo location.",
            );
            break;

          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Your current location could not be determined. Please try again.",
            );
            break;

          case error.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;

          default:
            setLocationError("Unable to determine your location.");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 30000,
      },
    );
  };

  const facilitiesWithDistance = useMemo(() => {
    return FACILITIES.map((facility) => ({
      ...facility,
      distanceKm: haversineDistanceKm(
        userLocation.latitude,
        userLocation.longitude,
        facility.latitude,
        facility.longitude,
      ),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation]);

  const filteredFacilities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return facilitiesWithDistance;
    }

    return facilitiesWithDistance.filter((facility) => {
      return (
        facility.name.toLowerCase().includes(query) ||
        facility.city.toLowerCase().includes(query) ||
        facility.type.toLowerCase().includes(query)
      );
    });
  }, [facilitiesWithDistance, searchQuery]);

  const selectedFacility =
    facilitiesWithDistance.find(
      (facility) => facility.id === selectedFacilityId,
    ) ?? facilitiesWithDistance[0];

  const mapFacilities = facilitiesWithDistance.map((facility) => ({
    id: facility.id,
    name: facility.name,
    latitude: facility.latitude,
    longitude: facility.longitude,
    type: facility.type,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-5">
          <Link
            href="/patient/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <MapPin className="h-5 w-5" />
              </div>

              <span className="text-sm font-semibold text-blue-600">
                Nearby Care
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Find nearby hospitals and clinics
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Find healthcare facilities near your current location throughout
              Bukidnon.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Crosshair className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {usingGps
                    ? "Using your current location"
                    : "Using Central Mindanao University"}
                </p>

                <p className="mt-0.5 text-xs leading-relaxed text-blue-700">
                  {usingGps
                    ? "Your browser provided your current GPS position. Distances are now calculated from your location."
                    : "CMU is being used as the default demo location. You can use your actual GPS location below."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locating}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {locating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding location...
                </>
              ) : (
                <>
                  <Crosshair className="h-4 w-4" />
                  Use My Location
                </>
              )}
            </button>
          </div>

          {locationError && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700">
              {locationError}
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Bukidnon healthcare map
                </h2>

                <p className="text-xs text-slate-500">
                  Your location → healthcare facilities
                </p>
              </div>
            </div>

            <div className="h-[420px] sm:h-[560px]">
              <BukidnonMap
                facilities={mapFacilities}
                selectedFacilityId={selectedFacilityId}
                onFacilitySelect={setSelectedFacilityId}
                demoLocation={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  label: usingGps ? "You are here" : "CMU demo location",
                }}
              />
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs leading-relaxed text-slate-500">
                Map data © OpenStreetMap contributors. Distances shown are
                straight-line estimates and may differ from actual road travel
                distance.
              </p>
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 sm:p-5">
              <div className="mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Healthcare facilities
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                      {facilitiesWithDistance.length} facilities available
                    </p>
                  </div>

                  <div className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Nearest first
                  </div>
                </div>
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search hospitals or clinics..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {filteredFacilities.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>

                  <p className="font-medium text-slate-900">
                    No facilities found
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredFacilities.map((facility) => {
                    const isSelected =
                      facility.id === selectedFacilityId ||
                      (!selectedFacilityId &&
                        facility.id === facilitiesWithDistance[0]?.id);

                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => setSelectedFacilityId(facility.id)}
                        className={`w-full px-4 py-4 text-left transition sm:px-5 ${
                          isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {facility.type === "Hospital" ? (
                              <Hospital className="h-5 w-5" />
                            ) : (
                              <Stethoscope className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p
                                  className={`font-semibold leading-snug ${
                                    isSelected
                                      ? "text-blue-900"
                                      : "text-slate-900"
                                  }`}
                                >
                                  {facility.name}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                                  <span>{facility.type}</span>

                                  <span className="text-slate-300">•</span>

                                  <span>{facility.city}</span>
                                </div>
                              </div>

                              <ChevronRight
                                className={`mt-0.5 h-4 w-4 shrink-0 ${
                                  isSelected
                                    ? "text-blue-500"
                                    : "text-slate-300"
                                }`}
                              />
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <div
                                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  isSelected
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                <MapPin className="h-3.5 w-3.5" />
                                {formatDistance(facility.distanceKm)}
                              </div>

                              {facility.id ===
                                facilitiesWithDistance[0]?.id && (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  Nearest
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {selectedFacility && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Selected facility
                  </p>

                  <h3 className="mt-0.5 font-semibold text-slate-900">
                    {selectedFacility.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedFacility.city} ·{" "}
                    {formatDistance(selectedFacility.distanceKm)} from your
                    location
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFacilityId(selectedFacility.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <MapPin className="h-4 w-4" />
                Show on Map
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
