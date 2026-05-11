import schools from '../resources/schools_onemap.json';

export const SCHOOL_TYPE_LABELS = {
    primary: 'Primary',
    secondary: 'Secondary',
    'post-secondary': 'Post-secondary',
    'moe-kindergarten': 'MOE Kindergarten'
};

export const SCHOOL_TYPE_ORDER = [
    'primary',
    'secondary',
    'post-secondary',
    'moe-kindergarten'
];

export const SCHOOL_TYPE_COLORS = {
    primary: '#0EA5E9',
    secondary: '#22C55E',
    'post-secondary': '#F97316',
    'moe-kindergarten': '#EC4899'
};

export const DEFAULT_SCHOOL_TYPE_FILTERS = SCHOOL_TYPE_ORDER.map((schoolType) => ({
    id: schoolType,
    label: SCHOOL_TYPE_LABELS[schoolType],
    isChecked: true
}));

export function getCheckedSchoolTypes(schoolTypes){
    return schoolTypes
        .filter((schoolType) => schoolType.isChecked)
        .map((schoolType) => schoolType.id);
}

export function formatSchoolType(schoolType){
    return SCHOOL_TYPE_LABELS[schoolType] || toTitleCase(String(schoolType || '').replace(/[-_]/g, ' '));
}

export function getSchoolTypeColor(schoolType){
    return SCHOOL_TYPE_COLORS[schoolType] || '#64748B';
}

export function normalizeSchool(school){
    return {
        name: school.name,
        school_type: school.school_type,
        address: school.address,
        postal: school.postal
    };
}

export function getSchoolKey(school){
    return `${school.school_type}-${school.name}-${school.postal}`;
}

export function getSchoolsGeojson(){
    return {
        type: 'FeatureCollection',
        features: schools
            .filter((school) => school.coordinates?.longitude && school.coordinates?.latitude)
            .map((school) => ({
                type: 'Feature',
                properties: normalizeSchool(school),
                geometry: {
                    type: 'Point',
                    coordinates: [
                        school.coordinates.longitude,
                        school.coordinates.latitude
                    ]
                }
            }))
    };
}

function toTitleCase(str) {
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
