import { createSlice } from '@reduxjs/toolkit'

export const inputStateSlice = createSlice({
  name: 'inputState',
  initialState: {
    radius: 2,
    location: {
        "longitude" : 0,
        "latitude" : 0
    }
  },
  reducers: {
    updateLocation: (state, action )=> {
        state.location.latitude = action.payload.latitude;
        state.location.longitude = action.payload.longitude;
    },
    updateRadius: (state, action )=> {
        state.radius= parseFloat(action.payload);
    }
  },
})

// Action creators are generated for each case reducer function
export const { updateLocation, updateRadius } = inputStateSlice.actions

const inputStateReducer = inputStateSlice.reducer;
export default inputStateReducer