export const LAND_USE_TYPE_ORDER = [
    'RESIDENTIAL',
    'RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY',
    'COMMERCIAL & RESIDENTIAL',
    'COMMERCIAL',
    'COMMERCIAL / INSTITUTION',
    'BUSINESS 1',
    'BUSINESS 1 - WHITE',
    'BUSINESS 2',
    'BUSINESS 2 - WHITE',
    'BUSINESS PARK',
    'BUSINESS PARK - WHITE',
    'EDUCATIONAL INSTITUTION',
    'CIVIC & COMMUNITY INSTITUTION',
    'HEALTH & MEDICAL CARE',
    'PLACE OF WORSHIP',
    'PARK',
    'OPEN SPACE',
    'SPORTS & RECREATION',
    'BEACH AREA',
    'WATERBODY',
    'ROAD',
    'MASS RAPID TRANSIT',
    'LIGHT RAPID TRANSIT',
    'TRANSPORT FACILITIES',
    'UTILITY',
    'RESERVE SITE',
    'WHITE',
    'HOTEL',
    'AGRICULTURE',
    'CEMETERY',
    'PORT / AIRPORT',
    'SPECIAL USE',
    'RESIDENTIAL / INSTITUTION'
];

export const LAND_USE_TYPE_COLORS = {
    'AGRICULTURE': '#84CC16',
    'BEACH AREA': '#FACC15',
    'BUSINESS 1': '#F59E0B',
    'BUSINESS 1 - WHITE': '#FDBA74',
    'BUSINESS 2': '#EA580C',
    'BUSINESS 2 - WHITE': '#FED7AA',
    'BUSINESS PARK': '#D97706',
    'BUSINESS PARK - WHITE': '#FDE68A',
    'CEMETERY': '#71717A',
    'CIVIC & COMMUNITY INSTITUTION': '#6366F1',
    'COMMERCIAL': '#EF4444',
    'COMMERCIAL & RESIDENTIAL': '#F43F5E',
    'COMMERCIAL / INSTITUTION': '#EC4899',
    'EDUCATIONAL INSTITUTION': '#0EA5E9',
    'HEALTH & MEDICAL CARE': '#06B6D4',
    'HOTEL': '#A855F7',
    'LIGHT RAPID TRANSIT': '#64748B',
    'MASS RAPID TRANSIT': '#334155',
    'OPEN SPACE': '#22C55E',
    'PARK': '#16A34A',
    'PLACE OF WORSHIP': '#8B5CF6',
    'PORT / AIRPORT': '#475569',
    'RESERVE SITE': '#94A3B8',
    'RESIDENTIAL': '#F97316',
    'RESIDENTIAL / INSTITUTION': '#FB7185',
    'RESIDENTIAL WITH COMMERCIAL AT 1ST STOREY': '#FB923C',
    'ROAD': '#9CA3AF',
    'SPECIAL USE': '#7C3AED',
    'SPORTS & RECREATION': '#14B8A6',
    'TRANSPORT FACILITIES': '#0F766E',
    'UTILITY': '#0284C7',
    'WATERBODY': '#38BDF8',
    'WHITE': '#CBD5E1'
};

export function getLandUseTypeColor(landUseType){
    return LAND_USE_TYPE_COLORS[landUseType] || '#64748B';
}

export function formatLandUseType(landUseType){
    return toTitleCase(String(landUseType || '').replace(/\s*\/\s*/g, ' / '));
}

export function getLandUseKey(landUse){
    return String(landUse.land_use_key ?? landUse.OBJECTID ?? landUse.object_id ?? landUse.id ?? '');
}

export function normalizeLandUse(landUse){
    return {
        ...landUse,
        land_use_key: String(landUse.land_use_key ?? landUse.OBJECTID ?? landUse.object_id ?? landUse.id ?? ''),
        land_use_type: landUse.land_use_type || landUse.LU_DESC || landUse.lu_desc || 'UNKNOWN',
        land_use_text: landUse.land_use_text || landUse.LU_TEXT || landUse.lu_desc,
        gpr: landUse.gpr ?? landUse.GPR,
        area: landUse.area ?? landUse['SHAPE.AREA'] ?? landUse.shape_area
    };
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
