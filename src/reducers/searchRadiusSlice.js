import { createSlice } from '@reduxjs/toolkit'
import { point,buffer } from '@turf/turf';
export const searchRadiusStateSlice = createSlice({
  name: 'searchRadiusState',
  initialState: {
    radius: 0.4,
    location: {
        "longitude" : 0,
        "latitude" : 0
    },
    opacity: 0.15,
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
      const stationNames = featureCollection['features'].map(( feat )=>parseStationNames( feat['properties']['STN_NAME'] ))
      state.mrtStations = [ ...new Set(stationNames)];
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

function parseStationNames(str){
  if(str.toLowerCase().includes('ONE-NORTH')){
    return 'one-north MRT Station'
  }
  var parsed = '';
  var split = str.split(' ');
  for (let i = 0; i < split.length-2; i++) {
    const s = split[i];
    const pascal = toPascalCase(s);
    parsed+=pascal + ' ';
  }
  parsed += split[ split.length -2 ] + ' '
  parsed += toPascalCase(split[ split.length -1 ])
  

  return parsed;
}

function toPascalCase(str) {
  return str.replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
}
// Action creators are generated for each case reducer function
export const { updateLocation, updateRadius, updateMrtInRadius, updatePropertyTypes } = searchRadiusStateSlice.actions

const searchRadiusStateReducer = searchRadiusStateSlice.reducer;
export default searchRadiusStateReducer