import React, { useEffect, useCallback, useState } from "react";
import {
  Clock,
  Star,
  MapPin,
  Phone,
  Globe,
  ChevronUp,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setRoute, clearRoute } from "../store/routeSlice";

const InfoCard = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);

  const mode = useSelector((state) => state.mode.mode);
  const selectedBuilding = useSelector(
    (state) => state.searchBuilding.selectedBuilding
  );
  const currentLocation = useSelector((state) => state.myLocation.center);
  const route = useSelector((state) => state.route.route);

  const convertModeForAPI = useCallback((mode) => {
    const modeMap = {
      DRIVING: "DRIVE",
      DRIVE: "DRIVE",
      WALKING: "WALK",
      WALK: "WALK",
      BICYCLING: "BICYCLE",
      BIKE: "BICYCLE",
      TRANSIT: "TRANSIT",
    };
    return modeMap[mode] || "DRIVE";
  }, []);

  useEffect(() => {
    if (mode) {
      console.log("📌 Aktif mode değişti:", mode);
    }
  }, [mode]);

  useEffect(() => {
    if (route) {
      console.log("📌 Yeni rota bulundu, o anki mode:", mode);
    }
  }, [route]);

  const modeSwitcher = useCallback((apiMode) => {
    if (apiMode === "DRIVE") return "TRAFFIC_AWARE";
    return "ROUTING_PREFERENCE_UNSPECIFIED";
  }, []);

  const calculateDistance = useCallback((meters) => {
    if (!meters) return null;
    if (meters >= 1000) {
      return (meters / 1000).toFixed(1) + " km";
    } else {
      return meters + " m";
    }
  }, []);

  async function SetRoute() {
    if (!selectedBuilding || !selectedBuilding.geometry) {
      setRouteError("Seçili bina bilgisi eksik");
      return false;
    }

    const apiMode = convertModeForAPI(mode);

    setIsLoadingRoute(true);
    setRouteError(null);

    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: currentLocation ? currentLocation.lat : 41.0082,
            longitude: currentLocation ? currentLocation.lng : 28.9784,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: selectedBuilding.geometry.location.lat,
            longitude: selectedBuilding.geometry.location.lng,
          },
        },
      },
      travelMode: apiMode, // DRIVE | WALK | BICYCLE | TRANSIT
      routingPreference: modeSwitcher(apiMode),
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: "tr-TR",
      units: "METRIC",
    };

    try {
      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
            "X-Goog-FieldMask":
              "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) throw new Error("Rota hesaplanamadı");

      const data = await response.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error("Rota bulunamadı");
      }

      const d = data.routes[0];
      dispatch(setRoute(JSON.stringify(d)));
      return d;
    } catch (error) {
      console.error("❌ Rota hatası:", error);
      setRouteError(error.message || "Rota hesaplanırken hata oluştu");
      return false;
    } finally {
      setIsLoadingRoute(false);
    }
  }

  

  useEffect(() => {
    if (route) {
      SetRoute();
    }
  }, [mode]);

  const handleCall = useCallback(() => {
    if (selectedBuilding?.formatted_phone_number) {
      window.location.href = `tel:${selectedBuilding.formatted_phone_number}`;
    }
  }, [selectedBuilding]);

  const handleWebsite = useCallback(() => {
    if (selectedBuilding?.website) {
      window.open(selectedBuilding.website, "_blank", "noopener,noreferrer");
    }
  }, [selectedBuilding]);

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    }, []);

  if (!selectedBuilding) return null;

  return (
    <div
      className={`fixed bottom-0 z-[999] left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
        isOpen ? "transform translate-y-0" : "transform translate-y-3/4"
      }`}
      role="dialog"
      aria-label="Konum bilgileri"
    >
      <button
        onClick={onToggle}
        className="w-full p-2 flex justify-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={isOpen ? "Kartı küçült" : "Kartı genişlet"}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
      </button>

      <div className="px-4 py-2 border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{selectedBuilding.name}</h2>
            <p className="text-sm text-gray-600">
              {selectedBuilding.types?.[0] || "İşletme"}
            </p>
          </div>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label={isOpen ? "Kapat" : "Aç"}
          >
            {isOpen ? (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>

        <div className="flex items-center mt-2 space-x-4">
          {selectedBuilding.rating && (
            <div className="flex items-center">
              <Star fill="yellow" className="w-4 h-4 text-yellow-500 mr-1" />
              <span className="text-sm font-medium">
                {selectedBuilding.rating.toFixed(1)}
              </span>
            </div>
          )}
          {route && (
            <span className="text-sm text-gray-600">
              {calculateDistance(JSON.parse(route)?.distanceMeters)}
            </span>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-h-96 overflow-y-auto">
        {selectedBuilding.photos && selectedBuilding.photos.length > 0 && (
          <div className="w-full flex justify-start mb-4 gap-2 overflow-x-auto pb-2">
            {selectedBuilding.photos.map((photo, index) => (
              <img
                key={index}
                src={photo?.url}
                alt={`Fotoğraf ${index + 1}`}
                className="w-64 h-48 object-cover rounded-lg flex-shrink-0"
              />
            ))}
          </div>
        )}

        {routeError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{routeError}</p>
          </div>
        )}

        {isLoadingRoute && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-600">Rota güncelleniyor...</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          {!route ? (
            <button
              onClick={() => SetRoute()}
              disabled={isLoadingRoute}
              className="flex flex-col items-center p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Yol tarifi al"
            >
              {isLoadingRoute ? (
                <Loader2 className="w-5 h-5 mb-1 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 mb-1" />
              )}
              <span className="text-xs">
                {isLoadingRoute ? "Hesaplanıyor..." : "Yol Tarifi"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => dispatch(clearRoute())}
              className="flex flex-col items-center p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              aria-label="Rotayı iptal et"
            >
              <MapPin className="w-5 h-5 mb-1" />
              <span className="text-xs">İptal</span>
            </button>
          )}

          {selectedBuilding.formatted_phone_number && (
            <button
              onClick={handleCall}
              className="flex flex-col items-center p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              aria-label="Ara"
            >
              <Phone className="w-5 h-5 mb-1" />
              <span className="text-xs">Ara</span>
            </button>
          )}

          {selectedBuilding.website && (
            <button
              onClick={handleWebsite}
              className="flex flex-col items-center p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              aria-label="Web sitesine git"
            >
              <Globe className="w-5 h-5 mb-1" />
              <span className="text-xs">Web Sitesi</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {selectedBuilding.formatted_address && (
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-gray-900">
                {selectedBuilding.formatted_address}
              </p>
            </div>
          )}

          {selectedBuilding.opening_hours?.weekday_text && (
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-900">
                {selectedBuilding.opening_hours.weekday_text.map((day, idx) => (
                  <p key={idx}>{day}</p>
                ))}
              </div>
            </div>
          )}

          {selectedBuilding.formatted_phone_number && (
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
              <a
                href={`tel:${selectedBuilding.formatted_phone_number}`}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectedBuilding.formatted_phone_number}
              </a>
            </div>
          )}

          {selectedBuilding.website && (
            <div className="flex items-start">
              <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
              <a
                href={selectedBuilding.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline break-all"
              >
                {selectedBuilding.website}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoCard;
