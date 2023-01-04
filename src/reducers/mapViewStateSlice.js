import { createSlice } from '@reduxjs/toolkit'

export const mapViewStateSlice = createSlice({
  name: 'mapViewState',
  initialState: {
    longitude: 103.81,
    latitude:  1.3513 ,
    zoom: 10.77,
    maxBounds : { 
        minLon: 103.57,
        minLat: 1.193904,
        maxLon: 104.05,
        maxLat: 1.474612 
    },
    transactions : [],
    status: 'idle',
    error : null 
  },
  reducers: {
    //action??
    updateViewState: (state, action) => {
      state.latitude = action.payload.latitude;
      state.longitude = action.payload.longitude;
      state.zoom = action.payload.zoom;
      
    },
    updateBounds: ( state, action )=> {
      //send query ehre
      //
      // console.log( action );
    }
  },
})

// Action creators are generated for each case reducer function
export const { updateViewState, updateBounds } = mapViewStateSlice.actions

const mapViewStateReducer = mapViewStateSlice.reducer;
export default mapViewStateReducer