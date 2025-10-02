
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  center: JSON.parse(localStorage.getItem("myLocation")) || null,
};

const myLocationSlice = createSlice({
  name: "myLocation",
  initialState,
  reducers: {
    setMyLocation: (state, action) => {
      state.center = action.payload; // { lat, lng }
      localStorage.setItem("myLocation", JSON.stringify(action.payload));
    },
    clearMyLocation: (state) => {
      state.center = null;
      localStorage.removeItem("myLocation");
    },
  },
});

export const { setMyLocation, clearMyLocation } = myLocationSlice.actions;
export default myLocationSlice.reducer;
