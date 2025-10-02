import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setSelectedBuilding,
  clearSelectedBuilding,
} from "../store/searchBuildingSlice";
import { setMyLocation } from "../store/myLocation";

const containerStyle = {
  width: "100%",
  height: "100vh",
};

function MapComponent({ mapRef }) {
  const dispatch = useDispatch();

  // 🔹 State & Redux
  const [center, setCenter] = useState({ lat: 41.0082, lng: 28.9784 }); // Default: İstanbul
  const selectedPlace = useSelector((state) => state.search.selectedPlace);
  const selectedBuilding = useSelector(
    (state) => state.searchBuilding.selectedBuilding
  );
  const currentLocation = useSelector((state) => state.myLocation.center);
  const route = useSelector((state) => state.route.route);

  const [path, setPath] = useState([]);
  const [places, setPlaces] = useState([]);

  // 📍 Mevcut konumu al
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        dispatch(setMyLocation({ lat: latitude, lng: longitude }));
        console.log("Current location:", { lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Konum alınamadı:", error);
      },
      { enableHighAccuracy: true }
    );
  }, [dispatch]);

  // 📍 Redux -> Center güncelleme
  useEffect(() => {
    if (currentLocation) {
      setCenter(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (selectedPlace) {
      setCenter(selectedPlace);
    }
  }, [selectedPlace]);

  // 📍 Rota polyline decode
  useEffect(() => {
    if (!route) {
      setPath([]);
      return;
    }
    if (window.google?.maps?.geometry) {
      try {
        const parsed = JSON.parse(route);
        const decodedPath = window.google.maps.geometry.encoding.decodePath(
          parsed.polyline?.encodedPolyline
        );
        setPath(decodedPath);
      } catch (err) {
        console.error("Polyline decode error:", err);
      }
    }
  }, [route, selectedBuilding]);

  // 📍 Harita yüklenince yakındaki işletmeleri çek
  const handleLoad = (map) => {
    mapRef.current = map;

    const service = new window.google.maps.places.PlacesService(map);
    const request = {
      location: center,
      radius: 1500,
      type: ["restaurant", "pharmacy", "hospital"],
    };

    service.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK) {
        console.log("Yakındaki işletmeler:", results);
        setPlaces(results);
      } else {
        console.warn("NearbySearch başarısız:", status);
      }
    });
  };

  // 📍 İşletme detayları
  const getPlaceDetails = async (e, map) => {
    if (e?.xi) {
      // boş alana tıklanınca seçimi temizle
      dispatch(clearSelectedBuilding());
      return;
    }
    if (!e.placeId) return;

    const service = new window.google.maps.places.PlacesService(map);

    const request = {
      placeId: e.placeId,
      fields: [
        "name",
        "formatted_address",
        "formatted_phone_number",
        "rating",
        "opening_hours",
        "photos",
        "geometry",
      ],
    };

    try {
      const place = await new Promise((resolve, reject) => {
        service.getDetails(request, (result, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });

      // ✅ Güvenli veri
      const safePlace = {
        name: place?.name || "",
        formatted_address: place?.formatted_address || "",
        formatted_phone_number: place?.formatted_phone_number || null,
        rating: place?.rating ?? null,
        geometry: place?.geometry
          ? {
              location: {
                lat: place.geometry.location?.lat(),
                lng: place.geometry.location?.lng(),
              },
            }
          : null,
        opening_hours: place?.opening_hours
          ? {
              open_now:
                place.opening_hours.isOpen?.() ??
                place.opening_hours.open_now ??
                null,
              weekday_text: place.opening_hours.weekday_text || [],
            }
          : null,
        photos: Array.isArray(place?.photos)
          ? place.photos.map((p) => ({
              url: p.getUrl({ maxWidth: 400 }),
              author: p.html_attributions?.[0] || "",
            }))
          : [],
      };

      console.log("Seçilen işletme detayları:", safePlace);
      dispatch(setSelectedBuilding(safePlace));
      return safePlace;
    } catch (err) {
      console.error("Detaylar alınamadı:", err);
      return null;
    }
  };

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={15}
      onLoad={handleLoad}
      onClick={(e) => getPlaceDetails(e, mapRef.current)}
      mapId={import.meta.env.VITE_GOOGLE_MAP_ID}
    >
      {/* 📌 Rota çizgisi */}
      {path.length > 0 && (
        <Polyline
          path={path}
          options={{
            strokeColor: "#1E90FF",
            strokeOpacity: 0.8,
            strokeWeight: 5,
          }}
        />
      )}

      {/* 📌 Seçili işletmeye marker */}
      {selectedBuilding?.geometry?.location && (
        <Marker
          position={{
            lat: selectedBuilding.geometry.location.lat,
            lng: selectedBuilding.geometry.location.lng,
          }}
          icon={{
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new window.google.maps.Size(50, 50),
            anchor: new window.google.maps.Point(25, 50),
          }}
        />
      )}

      {/* 📌 Mevcut konum marker */}
      {currentLocation && (
        <Marker
          position={currentLocation}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          }}
        />
      )}
    </GoogleMap>
  );
}

export default MapComponent;
