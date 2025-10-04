import { Car, Bike, Bus, Footprints, XCircle } from "lucide-react";

const modeIcons = {
  DRIVE: <Car className="w-5 h-5 text-blue-600" />,
  BICYCLE: <Bike className="w-5 h-5 text-green-600" />,
  TRANSIT: <Bus className="w-5 h-5 text-purple-600" />,
  WALK: <Footprints className="w-5 h-5 text-orange-600" />,
};

const modeLabels = {
  DRIVE: "ARABA",
  WALK: "YÜRÜYÜŞ",
  TRANSIT: "TOPLU TAŞIMA",
  BICYCLE: "BİSİKLET",
};

const normalizeMode = (mode) => {
  switch (mode) {
    case "DRIVING":
      return "DRIVE";
    case "WALKING":
      return "WALK";
    case "BICYCLING":
      return "BICYCLE";
    case "TRANSIT":
      return "TRANSIT";
    default:
      return "DRIVE";
  }
};

const calculateDistance = (meters) => {
  if (!meters) return null;
  if (meters >= 1000) {
    return (meters / 1000).toFixed(1) + " km";
  } else {
    return meters + " m";
  }
};

const RouteCard = ({ routeInfo, mode, onCancel }) => {
  if (!routeInfo) return null;

  const normalizedMode = normalizeMode(mode);

  let parsedRoute = null;
  try {
    parsedRoute = routeInfo ? JSON.parse(routeInfo) : null;
  } catch (e) {
    console.error("Route parsing error:", e);
  }

  let formattedDuration = "";
  if (parsedRoute?.duration) {
    const totalSec = parseInt(parsedRoute.duration.replace("s", ""), 10);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (hours > 0) {
      formattedDuration = `${hours} sa ${minutes} dk`;
    } else if (minutes > 0) {
      formattedDuration = `${minutes} dk ${
        seconds > 0 ? `${seconds} sn` : ""
      }`;
    } else {
      formattedDuration = `${seconds} sn`;
    }
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#ffffff] text-black rounded-t-2xl shadow-lg p-4 z-50">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          {modeIcons[normalizedMode] || (
            <Car className="w-5 h-5 text-gray-900" />
          )}
          <h2 className="text-lg font-semibold">
            {modeLabels[normalizedMode] || normalizedMode}
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 border border-red-500 bg-red-600 text-white px-1.5 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
        >
          <XCircle className="w-5 h-5" />
          <span>İptal Et</span>
        </button>
      </div>

      {parsedRoute && (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">{formattedDuration}</p>
            <p className="text-sm text-gray-600">
              {calculateDistance(parsedRoute.distanceMeters)}
            </p>
          </div>
          <div className="bg-blue-600 px-4 py-2 text-white border border-blue-500 rounded-lg text-sm font-medium">
            Tahmini: {formattedDuration}
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteCard;
