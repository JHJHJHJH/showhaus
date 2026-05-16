import { createSlice } from '@reduxjs/toolkit'
import { point, circle } from '@turf/turf';
import { DEFAULT_SCHOOL_TYPE_FILTERS } from '../utils/schoolData';
export const searchRadiusStateSlice = createSlice({
  name: 'searchRadiusState',
  initialState: {
    radius: 0.2,
    location: {
        "longitude" : 0,
        "latitude" : 0
    },
    opacity: 0.1,
    searchRadius: {},
    mrtStations: [],
    schoolsInRadius: [],
    projectsInRadius: [],
    landUsesInRadius: [],
    selectedLandUse: null,
    landContextReloadKey: null,
    schoolTypes: DEFAULT_SCHOOL_TYPE_FILTERS,
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
    },
    updateSchoolsInRadius: (state, action )=> {
      state.schoolsInRadius = action.payload;
    },
    updateProjectsInRadius: (state, action )=> {
      state.projectsInRadius = action.payload;
    },
    updateLandUsesInRadius: (state, action )=> {
      state.landUsesInRadius = action.payload;
    },
    updateSelectedLandUse: (state, action )=> {
      state.selectedLandUse = action.payload;
    },
    updateLandContextResults: (state, action )=> {
      state.landUsesInRadius = action.payload.landUses || [];
      state.projectsInRadius = action.payload.projects || [];
      state.schoolsInRadius = action.payload.schools || [];
      state.selectedLandUse = action.payload.selectedLandUse || null;
    },
    requestLandContextReload: (state, action )=> {
      state.landContextReloadKey = action.payload || Date.now();
      state.schoolsInRadius = [];
      state.projectsInRadius = [];
      state.landUsesInRadius = [];
      state.selectedLandUse = null;
    },
    updateSchoolTypes: (state, action )=> {
      state.schoolTypes = action.payload;
    }
  },
})

//Source
//https://labs.mapbox.com/education/proximity-analysis/selecting-within-a-distance/#your-turn
//Creates radiusGeojson circle
function makeRadiusGeojson(lngLatArray, radiusInKilometers){
  return circle(lngLatArray, radiusInKilometers, { units: 'kilometers' });
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
export const { updateLocation, updateRadius, updateMrtInRadius, updatePropertyTypes, updateSchoolsInRadius, updateProjectsInRadius, updateLandUsesInRadius, updateSelectedLandUse, updateLandContextResults, requestLandContextReload, updateSchoolTypes } = searchRadiusStateSlice.actions

const searchRadiusStateReducer = searchRadiusStateSlice.reducer;
export default searchRadiusStateReducer
