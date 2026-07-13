import MRT_RAIL_STN from '../resources/RAIL_STN';

test('MRT station fixture is available', () => {
    expect(MRT_RAIL_STN.type).toBe('FeatureCollection');
    expect(MRT_RAIL_STN.features.length).toBeGreaterThan(0);
});
