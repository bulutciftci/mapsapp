import { configureStore } from "@reduxjs/toolkit";
import searchReducer from "./searchSlice";
import searchBuildingSlice from "./searchBuildingSlice";
import modeSlice from "./modeSlice";
import routeSlice from "./routeSlice"
import myLocationSlice from "./myLocation";
export const store = configureStore({
  reducer: {
    search: searchReducer,
    searchBuilding: searchBuildingSlice,
    mode: modeSlice,
    route: routeSlice,
    myLocation: myLocationSlice,
    },
});
export default store;