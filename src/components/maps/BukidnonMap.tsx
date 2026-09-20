"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type FacilityMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: "Hospital" | "Clinic";
};

type DemoLocation = {
  latitude: number;
  longitude: number;
  label?: string;
};

type BukidnonMapProps = {
  facilities: FacilityMarker[];
  selectedFacilityId?: string;
  onFacilitySelect?: (facilityId: string) => void;
  demoLocation?: DemoLocation;
};

const BUKIDNON_CENTER: L.LatLngExpression = [7.86, 125.05];
const DEFAULT_ZOOM = 10;

const DEFAULT_DEMO_LOCATION: DemoLocation = {
  latitude: 7.85826707096227,
  longitude: 125.04761833703593,
  label: "CMU demo location",
};

export default function BukidnonMap({
  facilities,
  selectedFacilityId,
  onFacilitySelect,
  demoLocation = DEFAULT_DEMO_LOCATION,
}: BukidnonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const markersRef = useRef<Record<string, L.Marker>>({});
  const demoMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: BUKIDNON_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      Object.values(markersRef.current).forEach((marker) => {
        marker.remove();
      });

      markersRef.current = {};

      if (demoMarkerRef.current) {
        demoMarkerRef.current.remove();
        demoMarkerRef.current = null;
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    Object.values(markersRef.current).forEach((marker) => {
      marker.remove();
    });

    markersRef.current = {};

    facilities.forEach((facility) => {
      const isSelected = facility.id === selectedFacilityId;
      const size = isSelected ? 44 : 38;

      const icon = L.divIcon({
        className: "",
        html: `
          <div
            style="
              width: ${size}px;
              height: ${size}px;
              border-radius: 9999px;
              background: ${isSelected ? "#2563eb" : "#ffffff"};
              border: 3px solid #ffffff;
              box-shadow: 0 4px 12px rgba(15, 23, 42, 0.25);
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${isSelected ? "#ffffff" : "#2563eb"};
              transition: all 150ms ease;
            "
          >
            ${
              facility.type === "Hospital"
                ? `
                  <svg
                    width="${isSelected ? "21" : "18"}"
                    height="${isSelected ? "21" : "18"}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 21v-4h6v4" />
                    <path d="M9 10h6" />
                    <path d="M12 7v6" />
                  </svg>
                `
                : `
                  <svg
                    width="${isSelected ? "21" : "18"}"
                    height="${isSelected ? "21" : "18"}"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    <path d="M12 6v7" />
                    <path d="M8.5 9.5h7" />
                  </svg>
                `
            }
          </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)],
      });

      const marker = L.marker([facility.latitude, facility.longitude], {
        icon,
        title: facility.name,
      }).addTo(map);

      marker.bindTooltip(facility.name, {
        direction: "top",
        offset: [0, -20],
        opacity: 0.95,
      });

      marker.on("click", () => {
        onFacilitySelect?.(facility.id);
      });

      markersRef.current[facility.id] = marker;
    });
  }, [facilities, selectedFacilityId, onFacilitySelect]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (demoMarkerRef.current) {
      demoMarkerRef.current.remove();
      demoMarkerRef.current = null;
    }

    const demoIcon = L.divIcon({
      className: "",
      html: `
        <div
          style="
            position: relative;
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <div
            style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 9999px;
              background: rgba(37, 99, 235, 0.18);
              animation: telecare-location-pulse 1.8s ease-out infinite;
            "
          ></div>

          <div
            style="
              position: relative;
              width: 20px;
              height: 20px;
              border-radius: 9999px;
              background: #2563eb;
              border: 4px solid #ffffff;
              box-shadow: 0 3px 10px rgba(15, 23, 42, 0.35);
            "
          ></div>

          <style>
            @keyframes telecare-location-pulse {
              0% {
                transform: scale(0.7);
                opacity: 0.9;
              }

              70% {
                transform: scale(1.35);
                opacity: 0.2;
              }

              100% {
                transform: scale(1.45);
                opacity: 0;
              }
            }
          </style>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26],
    });

    const demoMarker = L.marker(
      [demoLocation.latitude, demoLocation.longitude],
      {
        icon: demoIcon,
        zIndexOffset: 2000,
        interactive: true,
        title: demoLocation.label ?? "You are here",
      },
    ).addTo(map);

    demoMarker.bindTooltip(
      `
        <div style="font-weight: 600;">
          ${demoLocation.label ?? "You are here"}
        </div>

        <div style="font-size: 11px; margin-top: 2px;">
          ${
            demoLocation.label === "CMU demo location"
              ? "Central Mindanao University"
              : "Browser GPS location"
          }
        </div>
      `,
      {
        direction: "top",
        offset: [0, -24],
        opacity: 0.98,
      },
    );

    demoMarkerRef.current = demoMarker;

    map.flyTo(
      [demoLocation.latitude, demoLocation.longitude],
      Math.max(map.getZoom(), 13),
      {
        duration: 0.8,
      },
    );

    return () => {
      if (demoMarkerRef.current === demoMarker) {
        demoMarker.remove();
        demoMarkerRef.current = null;
      }
    };
  }, [demoLocation]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !selectedFacilityId) {
      return;
    }

    const selectedFacility = facilities.find(
      (facility) => facility.id === selectedFacilityId,
    );

    if (!selectedFacility) {
      return;
    }

    map.flyTo(
      [selectedFacility.latitude, selectedFacility.longitude],
      Math.max(map.getZoom(), 13),
      {
        duration: 0.7,
      },
    );
  }, [selectedFacilityId, facilities]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .leaflet-container {
          z-index: 0 !important;
        }

        .leaflet-pane {
          z-index: 0 !important;
        }

        .leaflet-top,
        .leaflet-bottom {
          z-index: 1 !important;
        }

        .leaflet-control {
          z-index: 1 !important;
        }
      `}</style>

      <div
        ref={mapContainerRef}
        className="relative h-full w-full overflow-hidden"
        aria-label="Interactive map of healthcare facilities in Bukidnon"
      />
    </>
  );
}
