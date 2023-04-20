import { createSlice } from '@reduxjs/toolkit'
import { point,buffer } from '@turf/turf';
export const searchRadiusStateSlice = createSlice({
  name: 'searchRadiusState',
  initialState: {
    radius: 1.5,
    location: {
        "longitude" : 0,
        "latitude" : 0
    },
    opacity: 0.12,
    searchRadius: {},
    mrtStations: [],
    propertyTypes: []
  },
  reducers: {
    updatePropertyTypes: (state, action )=> {
      state.propertyTypes = action.payload;      
    },
    updateLocation: (state, action )=> {
        state.location.latitude = action.payload.latitude;
        state.location.longitude = action.payload.longitude;
        state.searchRadius = makeRadiusGeojson( [state.location.longitude , state.location.latitude], state.radius );
    },
    updateRadius: (state, action )=> {
        state.radius= parseFloat(action.payload);
        state.searchRadius = makeRadiusGeojson( [state.location.longitude , state.location.latitude], state.radius );
    },
    updateMrtInRadius: (state, action )=> {
      const featureCollection = action.payload
      const stationNames = featureCollection['features'].map(( feat )=> feat['properties']['STN_NAME'] )
      state.mrtStations = [ ...new Set(stationNames )];
      // state.mrtCodes = featureCollection['features'].map(( feat )=> feat['properties']['STN_CODE'] )
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
export const { updateLocation, updateRadius, updateMrtInRadius, updatePropertyTypes } = searchRadiusStateSlice.actions

const searchRadiusStateReducer = searchRadiusStateSlice.reducer;
export default searchRadiusStateReducer