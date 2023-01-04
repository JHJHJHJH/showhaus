import mrtJson from '../resources/MRTLRTStn_EPSG4326.json'
import * as fs from 'fs';

test('MRT layer categorisation', () => {
    const categorised  = categoriseStations( mrtJson );
    
    const sorted = sortCategorisedStations( categorised );

    fs.writeFileSync('test.json', JSON.stringify(sorted , null, 4));
    const tripsData = generateTripsData(sorted );
    const testLine = 'EW'
    const sample = sorted
    
    
    [testLine][0];
    expect(sample.properties['LINE']).toBe(testLine);
});

function cleanDuplicateStations( mrtJson ){
    const cleaned = { type: "FeatureCollection", features: [] }
    const stationList = []
    for (let i = 0; i < mrtJson.features.length; i++) {
        const feature = mrtJson.features[i];
        const stnName = feature.properties['STN_NAME'];
        
        if( !stationList.includes(stnName) ){
            cleaned.features.push( feature );
            stationList.push( stnName);
        }
    }
    return cleaned;
}

function categoriseStations( mrtJson ){
    const cleanedMrtJson = cleanDuplicateStations( mrtJson );
    const stationDict = {}

    for (let i = 0; i < cleanedMrtJson.features.length; i++) {
        const feature = JSON.parse(JSON.stringify(cleanedMrtJson.features[i]));
        const stationNumber = feature.properties['STN_NO'];
        
        const split = stationNumber.split('/');
        for (let j = 0; j < split.length; j++) {
            const clonedFeature = JSON.parse(JSON.stringify(cleanedMrtJson.features[i]));
            const line = split[j].substring(0,2);
            const number = split[j].substring(2);
            clonedFeature.properties["LINE"] = line;
            clonedFeature.properties["LINE_NO"] = number;
            
            if( line in stationDict ){
                stationDict[ line ].push( clonedFeature );
            }
            else {
                stationDict[ line ] = [ clonedFeature ];
            }
        }

        cleanedMrtJson.features[i] = feature;
    }

    return stationDict;
}

function sortCategorisedStations( categorisedStations ){

    const clonedStations = JSON.parse(JSON.stringify(categorisedStations));

    for (const key in clonedStations) {
        const stations = clonedStations[key];
        //console.log(  stations )
        stations.sort(function(a,b){
            return a.properties['LINE_NO'] - b.properties['LINE_NO'];
        });

        clonedStations[key] = stations;
    }

    return clonedStations;

}

function generateTripsData( sortedStations ){

    var tripsData = []
    var numberOfPoints = 100;
    for (const key in sortedStations) {
        var points = [];
        var timestamp = [];
        if (Object.hasOwnProperty.call(sortedStations, key)) {
            const stations = sortedStations[key];
            
            if( stations.length < 2){
                break;
            }

            for (let i = 0; i < numberOfPoints; i++) {
                
                const index = i % (stations.length) ;

                const station = stations[index];

                // points.push({
                //     position: [ station.geometry.coordinates ],
                //     timestamp: i,
                //     name: station.properties.LINE,
                //     number: station.properties.LINE_NO
                // });
                points.push([ station.geometry.coordinates]);
                timestamp.push( i );
            }
        }
        const pathObj = {
            "path" : points,
            "timestamps" : timestamp,
            "color" : mapMrtColors(key)
        }
        tripsData.push( pathObj );
    }

    console.log(tripsData );
    return tripsData;
}

function mapMrtColors( line ){
    let rgb = [0,0,0];
    switch(line){
        case 'NS':
            rgb = [228,53,48];
            break;
        case 'TE':
            rgb = [159,94,29];
            break;
        case 'EW':
        case 'CG':
            rgb = [12,153,67];
            break;
        case 'NE':
            rgb = [161,45,182];
            break;
        case 'CE':
        case 'CC':
            rgb = [255,162,35];
            break;
        case 'DT':
            rgb = [5,89,185];
            break;
        
        case 'PT':
        case 'ST':
        case 'SW':
        case 'BP':
        case 'PE':
        case 'PW':
        case 'SE':
            rgb = [142,155,144]
            break;
        default:
            throw new Error('MRT Line not supported');
    }
    return rgb;
}