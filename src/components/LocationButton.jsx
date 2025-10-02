import { useDispatch } from "react-redux";
import { setMyLocation } from "../store/myLocation";

const LocateButton = ({ mapRef, infoExpanded }) => {
  const dispatch = useDispatch();

  const handleLocate = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          // Redux'a kaydet (myLocation slice)
          dispatch(setMyLocation(pos));

          // Haritayı konuma taşı
          if (mapRef.current) {
            mapRef.current.panTo(pos);
            mapRef.current.setZoom(15);
          }

          console.log("✅ Konum güncellendi:", pos);
        },
        (error) => {
          console.error("❌ Konum alınamadı:", error);
          alert("Konum izni verilmedi veya konum alınamadı.");
        }
      );
    } else {
      alert("Tarayıcınız konum servislerini desteklemiyor.");
    }
  };

  return (
    <button 
      onClick={handleLocate} 
      className="fixed bottom-32 right-4 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 z-40"
    >
      📍
    </button>
  );
};

export default LocateButton;