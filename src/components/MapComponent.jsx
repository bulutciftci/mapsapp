import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setMyLocation } from "../store/myLocation";
import { setSelectedBuilding } from "../store/searchBuildingSlice";
import { clearSelectedBuilding } from "../store/searchBuildingSlice";
const containerStyle = {
  width: "100%",
  height: "100vh",
};

function MapComponent({ mapRef }) {
  const dispatch = useDispatch();
  const [initialCenter] = useState({ lat: 41.0082, lng: 28.9784 });
  const currentLocation = useSelector((state) => state.myLocation.center);
  const route = useSelector((state) => state.route.route);
  const selectedBuilding = useSelector(
    (state) => state.searchBuilding.searchBuilding
  );
  const [path, setPath] = useState([]);
  const [heading, setHeading] = useState(0);
  const [autoFollow, setAutoFollow] = useState(true);
  const lastUserInteraction = useRef(Date.now());
  const prevLocation = useRef(null);
  const pathRef = useRef([]);
  const currentAccuracy = useRef(20);

  useEffect(() => {
    if (!route) {
      setPath([]);
      pathRef.current = [];
      setAutoFollow(false);
      return;
    }
    if (window.google?.maps?.geometry) {
      try {
        const parsed = JSON.parse(route);
        const decodedPath = window.google.maps.geometry.encoding.decodePath(
          parsed.polyline?.encodedPolyline
        );
        setPath(decodedPath);
        pathRef.current = decodedPath;
        setAutoFollow(true);
      } catch (err) {
        console.error("Polyline decode error:", err);
      }
    }
  }, [route]);

  const snapToRoute = useCallback((location, routePath, accuracy = 20) => {
    if (!window.google?.maps?.geometry || routePath.length === 0)
      return location;

    let closestPoint = location;
    let minDistance = Infinity;

    const userLatLng = new window.google.maps.LatLng(
      location.lat,
      location.lng
    );

    for (let i = 0; i < routePath.length - 1; i++) {
      const segmentStart = routePath[i];
      const segmentEnd = routePath[i + 1];

      const closestOnSegment =
        window.google.maps.geometry.spherical.interpolate(
          segmentStart,
          segmentEnd,
          findClosestPointOnSegment(userLatLng, segmentStart, segmentEnd)
        );

      const distance =
        window.google.maps.geometry.spherical.computeDistanceBetween(
          userLatLng,
          closestOnSegment
        );

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = {
          lat: closestOnSegment.lat(),
          lng: closestOnSegment.lng(),
        };
      }
    }

    const threshold = Math.max(50, Math.min(accuracy * 3, 100));
    return minDistance < threshold ? closestPoint : location;
  }, []);

  const findClosestPointOnSegment = (point, segStart, segEnd) => {
    const startLat = segStart.lat();
    const startLng = segStart.lng();
    const endLat = segEnd.lat();
    const endLng = segEnd.lng();
    const pLat = point.lat();
    const pLng = point.lng();

    const dx = endLng - startLng;
    const dy = endLat - startLat;
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) return 0;

    const t = ((pLng - startLng) * dx + (pLat - startLat) * dy) / lengthSquared;

    return Math.max(0, Math.min(1, t));
  };

  const calculateHeading = useCallback((newLocation) => {
    if (!prevLocation.current || !window.google?.maps?.geometry) {
      prevLocation.current = newLocation;
      return;
    }

    const from = new window.google.maps.LatLng(
      prevLocation.current.lat,
      prevLocation.current.lng
    );
    const to = new window.google.maps.LatLng(newLocation.lat, newLocation.lng);

    const distance =
      window.google.maps.geometry.spherical.computeDistanceBetween(from, to);

    if (distance > 5) {
      const computedHeading =
        window.google.maps.geometry.spherical.computeHeading(from, to);
      if (!isNaN(computedHeading)) {
        setHeading(computedHeading);
      }
      prevLocation.current = newLocation;
    }
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.error("Tarayıcınız konum özelliğini desteklemiyor");
      return;
    }

    let watchId = null;
    let isWatching = false;

    const getInitialPosition = async () => {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 60000,
          });
        });

        const { latitude, longitude, accuracy } = position.coords;
        const initialLocation = { lat: latitude, lng: longitude };

        console.log(
          "İlk konum alındı:",
          initialLocation,
          "Doğruluk:",
          accuracy,
          "m"
        );

        dispatch(setMyLocation(initialLocation));
        prevLocation.current = initialLocation;

        startContinuousWatch();
      } catch (error) {
        console.warn(
          "İlk konum alınamadı, doğrudan izleme başlatılıyor:",
          error.message
        );
        startContinuousWatch();
      }
    };

    const startContinuousWatch = () => {
      if (isWatching) return;
      isWatching = true;

      console.log("Konum izleme başlatıldı");

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const {
            latitude,
            longitude,
            heading: deviceHeading,
            accuracy,
          } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };

          console.log(
            "Konum güncellendi:",
            newLocation,
            "Doğruluk:",
            accuracy,
            "m"
          );

          if (accuracy) {
            currentAccuracy.current = accuracy;
          }

          if (pathRef.current.length > 0 && window.google?.maps?.geometry) {
            const snappedLocation = snapToRoute(
              newLocation,
              pathRef.current,
              accuracy
            );
            dispatch(setMyLocation(snappedLocation));

            if (
              deviceHeading !== null &&
              deviceHeading !== undefined &&
              !isNaN(deviceHeading)
            ) {
              setHeading(deviceHeading);
              prevLocation.current = snappedLocation;
            } else {
              calculateHeading(snappedLocation);
            }
          } else {
            dispatch(setMyLocation(newLocation));

            if (
              deviceHeading !== null &&
              deviceHeading !== undefined &&
              !isNaN(deviceHeading)
            ) {
              setHeading(deviceHeading);
              prevLocation.current = newLocation;
            } else {
              calculateHeading(newLocation);
            }
          }
        },
        (error) => {
          console.error("Konum izleme hatası:", {
            code: error.code,
            message: error.message,
          });

          switch (error.code) {
            case 1:
              alert(
                "Konum izni gerekli. Lütfen tarayıcı ayarlarından konum iznini açın."
              );
              break;
            case 2:
              console.warn(
                "GPS sinyali zayıf veya konum servisi kullanılamıyor"
              );
              break;
            case 3:
              console.warn(
                "Konum alınırken zaman aşımı oluştu, izleme devam ediyor..."
              );
              break;
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: Infinity,
        }
      );
    };

    getInitialPosition();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        console.log("Konum izleme durduruldu");
      }
    };
  }, [dispatch, snapToRoute, calculateHeading]);

  useEffect(() => {
    if (
      !currentLocation ||
      !mapRef.current ||
      !autoFollow ||
      pathRef.current.length === 0
    ) {
      return;
    }

    if (Date.now() - lastUserInteraction.current < 3000) {
      setAutoFollow(false);
      return;
    }

    const timeSinceLastPan = Date.now() - (mapRef.current._lastPanTime || 0);
    if (timeSinceLastPan < 500) return;

    mapRef.current.panTo(currentLocation);
    mapRef.current._lastPanTime = Date.now();
  }, [currentLocation, autoFollow]);

  const handleMapDragStart = () => {
    lastUserInteraction.current = Date.now();
    setAutoFollow(false);
  };

  const handleRecenterClick = () => {
    setAutoFollow(true);
    lastUserInteraction.current = 0;
    if (currentLocation && mapRef.current) {
      mapRef.current.panTo(currentLocation);
    }
  };

  const getPlaceDetails = async (e, map) => {
    console.log(e);
    if (e?.yi) {
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
    <>
      <GoogleMap
        onClick={(e) => getPlaceDetails(e, mapRef.current)}
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={17}
        onLoad={(map) => {
          mapRef.current = map;
          map.setTilt(45);
          map.setHeading(0);

          map.setOptions({
            mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
            gestureHandling: "greedy", // tüm jestler aktif
            tilt: 45,
            heading: 0,
            rotateControl: true,
            tiltControl: true,
            zoomControl: true,
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: true,
            keyboardShortcuts: true,
            draggable: true,
            disableDefaultUI: false, // ⚠️ BUNU MUTLAKA FALSE YAP
            cameraControl: true, // 🔥 3D jest desteği
            cameraControlOptions: {
              position: google.maps.ControlPosition.RIGHT_TOP,
            },
          });
        }}
        options={{
          mapId: import.meta.env.VITE_GOOGLE_MAP_ID,
          gestureHandling: "greedy",
          rotateControl: true,
          tiltControl: true,
          disableDefaultUI: false,
        }}
      >
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

        {currentLocation && (
          <Marker
            position={currentLocation}
            icon={{
              path:
                path.length > 0
                  ? window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW
                  : window.google.maps.SymbolPath.CIRCLE,
              scale: path.length > 0 ? 7 : 10,
              fillColor: "#FF0000",
              fillOpacity: 1,
              strokeColor: "#918e8e",
              strokeWeight: 3,
              rotation: heading || 0,
              anchor:
                path.length > 0
                  ? new window.google.maps.Point(0, 2.5)
                  : new window.google.maps.Point(0, 0),
              labelOrigin: new window.google.maps.Point(0, -10),
            }}
          />
        )}
      </GoogleMap>
      {!autoFollow && (
        <button
          onClick={handleRecenterClick}
          title="Konumumu takip et"
          className={
            selectedBuilding
              ? "absolute bottom-[25px] right-[15px] w-[50px] h-[50px] rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center text-[24px] cursor-pointer transition-all duration-200 z-[9999]"
              : "absolute bottom-[150px] right-[15px] w-[50px] h-[50px] rounded-full bg-white shadow-md hover:shadow-lg flex items-center justify-center text-[24px] cursor-pointer transition-all duration-200 z-[90] scale-150"
          }
        >
          📍
        </button>
      )}
    </>
  );
}

export default MapComponent;
