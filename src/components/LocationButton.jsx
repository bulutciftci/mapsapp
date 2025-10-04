import { useDispatch } from "react-redux";
import { setMyLocation } from "../store/myLocation";
import { useState } from "react";

const LocateButton = ({ mapRef, onLocate, infoExpanded }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleLocate = async () => {
    
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum servislerini desteklemiyor.");
      return;
    }

    setIsLoading(true);

    
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'denied') {
        alert("Konum izni reddedilmiş. Lütfen tarayıcı ayarlarından izin verin.");
        setIsLoading(false);
        return;
      }
    } catch (err) {
      console.log("İzin kontrolü yapılamadı:", err);
    }

    
    const tryGetPosition = async () => {
      try {
      
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false,
              timeout: 5000,
              maximumAge: 60000 
            }
          );
        });
 
        return position;
      } catch (error) {
        console.log("Cache'den konum alınamadı, yüksek doğrulukla deneniyor...");
        
       
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Konum alınamadı"));
          }, 30000);

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              resolve(position);
            },
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: Infinity,
              maximumAge: 0
            }
          );
        });
      }
    };

    try {
      const position = await tryGetPosition();
      
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      
      console.log("✅ Konum bulundu:", pos, "Doğruluk:", position.coords.accuracy, "m");
      
      dispatch(setMyLocation(pos));
      
      if (mapRef.current) {
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(16);
      }
      
      onLocate?.();
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Konum hatası:", error);
      
      let errorMsg = "Konum alınamadı. ";
      switch(error.code) {
        case 1: 
          errorMsg += "İzin verilmedi.";
          break;
        case 2: 
          errorMsg += "GPS sinyali bulunamıyor. Lütfen açık bir alanda deneyin.";
          break;
        case 3: 
          errorMsg += "Konum almak çok uzun sürdü. Lütfen GPS'inizi kontrol edin.";
          break;
        default:
          errorMsg += error.message || "Bilinmeyen hata.";
      }
      
      alert(errorMsg);
      setIsLoading(false);
    }
  };

  if (infoExpanded) return null;

  return (
    <button
      onClick={handleLocate}
      disabled={isLoading}
      className={`fixed bottom-32 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 z-40 transition ${
        isLoading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      aria-label="Konumuma git"
    >
      {isLoading ? '⏳' : '📍'}
    </button>
  );
};

export default LocateButton;