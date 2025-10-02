import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  route: null || localStorage.getItem("route"),
};

const routeSlice = createSlice({
  name: "route",
  initialState,
  reducers: {
    setRoute: (state, action) => {
      state.route = action.payload;
      localStorage.setItem("route", action.payload);
    },
    clearRoute: (state) => {
      localStorage.removeItem("route");
      state.route = null;
    },
  },
});

export const { setRoute, clearRoute } = routeSlice.actions;
export default routeSlice.reducer;
