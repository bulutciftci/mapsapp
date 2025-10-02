import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  selectedPlace: null || localStorage.getItem("selectedPlace") ? JSON.parse(localStorage.getItem("selectedPlace")) : null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSelectedPlace: (state, action) => {
      state.selectedPlace = action.payload;
      localStorage.setItem("selectedPlace", JSON.stringify(action.payload));
    },
    clearSelectedPlace: (state) => {
      state.selectedPlace = null;
      localStorage.removeItem("selectedPlace");
    },
  },
});

export const { setSelectedPlace, clearSelectedPlace } = searchSlice.actions;
export default searchSlice.reducer;
