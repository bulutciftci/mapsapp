import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    mode: "drive" || localStorage.getItem("mode")  
};

const modeSlice = createSlice({
    name: "mode",
    initialState,
    reducers: {
        setMode: (state, action) => {
            state.mode = action.payload;
            localStorage.setItem("mode", action.payload);
        }
    }
}); 

export const { setMode } = modeSlice.actions;
export default modeSlice.reducer;