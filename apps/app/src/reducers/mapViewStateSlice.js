import { createSlice } from '@reduxjs/toolkit'

export const mapViewStateSlice = createSlice({
  name: 'mapViewState',
  initialState: {
    longitude: 103.8198,
    latitude:  1.343 ,
    zoom: 10.5,
    maxBounds : { 
        minLon: 103.57,
        minLat: 1.193904,
        maxLon: 104.1,
        maxLat: 1.4749 
    },
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