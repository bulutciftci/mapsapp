import { useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapComponent from "./components/MapComponent";
import SearchBar from "./components/SearchBar";
import InfoCard from "./components/InfoCard";
import { useSelector } from "react-redux";
import LocateButton from "./components/LocationButton";
import { useDispatch } from "react-redux";
import { clearSelectedPlace } from "./store/searchSlice";
import { clearSelectedBuilding } from "./store/searchBuildingSlice";
import { clearRoute } from "./store/routeSlice";
import RouteCard from "./components/RouteCard";

const libraries = ["places", "geometry"];

function App() {
  const dispatch = useDispatch();
  const selectedBuilding = useSelector(
    (state) => state.search.selectedBuilding
  );
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const mapRef = useRef(null);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const route = useSelector((state) => state.route.route);
  const mode = useSelector((state) => state.mode.mode);

  if (!isLoaded) {
    return <div>Harita yükleniyor...</div>;
  }

  return (
    <div>
      <SearchBar mapRef={mapRef} />
      <MapComponent mapRef={mapRef} />
      <LocateButton mapRef={mapRef} infoExpanded={infoExpanded} />
      {route ? (
        <RouteCard
          routeInfo={route}
          mode={mode}
          onCancel={() => dispatch(clearRoute())}
          isLoading={isLoadingRoute}
        />
      ) : (
        <InfoCard
          mode={mode}
          place={selectedBuilding}
          setIsLoadingRoute={setIsLoadingRoute}
        />
      )}
    </div>
  );
}

export default App;
