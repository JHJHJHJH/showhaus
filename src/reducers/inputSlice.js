import { createSlice } from '@reduxjs/toolkit'
import { point,buffer } from '@turf/turf';
export const inputStateSlice = createSlice({
  name: 'inputState',
  initialState: {
    radius: 2,
    location: {
        "longitude" : 0,
        "latitude" : 0
    },
    opacity: 0.12,
    searchRadius: {}
  },
  reducers: {
    updateLocation: (state, action )=> {
        state.location.latitude = action.payload.latitude;
        state.location.longitude = action.payload.longitude;
        state.searchRadius = makeRadiusGeojson( [state.location.longitude , state.location.latitude], state.radius );
    },
    updateRadius: (state, action )=> {
        state.radius= parseFloat(action.payload);
        state.searchRadius = makeRadiusGeojson( [state.location.longitude , state.location.latitude], state.radius );
    }
  },
})

//Source
//https://labs.mapbox.com/education/proximity-analysis/selecting-within-a-distance/#your-turn
//Creates radiusGeojson circle
function makeRadiusGeojson(lngLatArray, radiusInMeters){
  var pt = point(lngLatArray);
  var buffered = buffer(pt, radiusInMeters, { units: 'kilometers' });
  return buffered;
}


// Action creators are generated for each case reducer function
export const { updateLocation, updateRadius } = inputStateSlice.actions

const inputStateReducer = inputStateSlice.reducer;
export default inputStateReducer