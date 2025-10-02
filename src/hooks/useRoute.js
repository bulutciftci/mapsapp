import { useDispatch } from "react-redux";
import { setRoute, clearRoute } from "../store/routeSlice";

const MODE_MAP = {
  drive: "DRIVE",     // 🚗
  walk: "WALK",       // 🚶
  bike: "BICYCLE",    // 🚴
  transit: "TRANSIT", // 🚆
};

export const useRoute = () => {
  const dispatch = useDispatch();

  const fetchRoute = async (origin, dest, mode) => {
    if (!origin || !dest) {
      console.warn("Origin veya destination eksik!");
      return;
    }

    const travelMode = MODE_MAP[mode] || "DRIVE"; // fallback

    const body = {
      origin: {
        location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
      },
      destination: {
        location: { latLng: { latitude: dest.lat, longitude: dest.lng } },
      },
      travelMode, // ✅ BURADA ARTIK "DRIVE" | "WALK" | "BICYCLE" | "TRANSIT"
      computeAlternativeRoutes: false,
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
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Google Routes API yanıtı:", data);

      if (data.routes && data.routes.length > 0) {
        dispatch(setRoute(data.routes[0]));
      } else {
        dispatch(clearRoute());
        console.warn("Rota bulunamadı!");
      }
    } catch (err) {
      console.error("Rota alınırken hata:", err);
      dispatch(clearRoute());
    }
  };

  return { fetchRoute };
};
