import { Autocomplete } from "@react-google-maps/api";
import { Input } from "antd";
import React, { useRef, useState } from "react";
import ModeSwitcher from "./ModeSwitcher";
import { useDispatch } from "react-redux";
import {setSelectedPlace} from "../store/searchSlice"

const SearchBar = ({ map, onSelect }) => {
  const acRef = useRef(null);
  const [query, setQuery] = useState("");
  const dispatch = useDispatch();

  const handlePlaceChanged = () => {
    const place = acRef.current?.getPlace();
    if (!place || !place.geometry) return;

    const loc = place.geometry.location;
    const pos = { lat: loc.lat(), lng: loc.lng() };
    console.table(loc,pos)

    map?.panTo(pos);
    map?.setZoom(16);

    // onSelect?.(pos, place);
    console.log(pos)
    dispatch(setSelectedPlace(pos));
  };

  return (
    <div className=" flex flex-col gap-3 absolute top-4 left-1/2 -translate-x-1/2 w-[min(92vw,720px)] z-10">
      <Autocomplete
        onLoad={(ac) => (acRef.current = ac)}
        onPlaceChanged={handlePlaceChanged}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Adres, mekan veya işletme ara..."
          allowClear
          size="large"
          className="shadow-lg"
        />
      </Autocomplete>
      <ModeSwitcher />
    </div>
  );
};

export default SearchBar;
