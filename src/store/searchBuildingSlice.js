import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    selectedBuilding: null || localStorage.getItem("selectedBuilding") ? JSON.parse(localStorage.getItem("selectedBuilding")) : null,
};

const searchBuildingSlice = createSlice({
    name: "searchBuilding",
    initialState,
    reducers: {
        setSelectedBuilding: (state, action) => {
            state.selectedBuilding = action.payload;
            localStorage.setItem("selectedBuilding", JSON.stringify(action.payload));
        },
        clearSelectedBuilding: (state) => {
            state.selectedBuilding = null;
            localStorage.removeItem("selectedBuilding");
        }
    },
});

export default searchBuildingSlice.reducer;
export const { setSelectedBuilding, clearSelectedBuilding } = searchBuildingSlice.actions;