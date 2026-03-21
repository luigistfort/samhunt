// src/lib/constants.ts

export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington DC', PR: 'Puerto Rico',
};

export const NOTICE_TYPES = [
  'Solicitation',
  'Presolicitation',
  'Combined Synopsis/Solicitation',
  'Sources Sought',
  'Award Notice',
  'Justification',
  'Intent to Bundle Requirements',
  'Fair Opportunity / Limited Sources Justification',
  'Special Notice',
  'Sale of Surplus Property',
] as const;

export const SET_ASIDE_OPTIONS = [
  { value: 'small_business', label: 'Small Business', code: 'SBA' },
  { value: '8a', label: '8(a) Competitive', code: '8AN' },
  { value: '8a_sole', label: '8(a) Sole Source', code: '8A' },
  { value: 'hubzone', label: 'HUBZone', code: 'HZC' },
  { value: 'sdvosb', label: 'SDVOSB', code: 'SDVOSBC' },
  { value: 'wosb', label: 'WOSB', code: 'WOSB' },
  { value: 'edwosb', label: 'EDWOSB', code: 'EDWOSB' },
  { value: 'veteran', label: 'Veteran-Owned', code: 'VSB' },
] as const;

export const CERTIFICATION_OPTIONS = [
  { value: 'small_business', label: 'Small Business' },
  { value: '8a', label: '8(a)' },
  { value: 'hubzone', label: 'HUBZone' },
  { value: 'sdvosb', label: 'SDVOSB' },
  { value: 'vosb', label: 'VOSB' },
  { value: 'wosb', label: 'WOSB' },
  { value: 'edwosb', label: 'EDWOSB' },
  { value: 'sdb', label: 'SDB' },
  { value: 'mentor_protege', label: 'Mentor-Protégé' },
] as const;

export const POPULAR_NAICS = [
  { code: '541511', label: 'Custom Computer Programming' },
  { code: '541512', label: 'Computer Systems Design' },
  { code: '541519', label: 'Other Computer Related Services' },
  { code: '541611', label: 'Management Consulting' },
  { code: '541330', label: 'Engineering Services' },
  { code: '541720', label: 'R&D in Physical Sciences' },
  { code: '561320', label: 'Temporary Staffing Services' },
  { code: '236220', label: 'Commercial Construction' },
  { code: '621111', label: 'Medical Offices' },
  { code: '484110', label: 'Trucking' },
  { code: '561720', label: 'Janitorial Services' },
  { code: '611430', label: 'Professional Training' },
  { code: '922120', label: 'Law Enforcement' },
  { code: '336411', label: 'Aircraft Manufacturing' },
] as const;

export const FEDERAL_AGENCIES = [
  'Department of Defense',
  'Department of Veterans Affairs',
  'Department of Homeland Security',
  'Department of Health and Human Services',
  'General Services Administration',
  'Department of Transportation',
  'Department of Energy',
  'Department of Justice',
  'Department of the Interior',
  'Department of Agriculture',
  'Department of Commerce',
  'Department of Treasury',
  'Department of Education',
  'Department of Housing and Urban Development',
  'NASA',
  'Social Security Administration',
  'Environmental Protection Agency',
  'State Department',
] as const;

export const URGENCY_CONFIG = {
  critical: { label: 'Closes Today-3 Days', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  urgent:   { label: 'Closes This Week', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  normal:   { label: 'Closes This Month', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  low:      { label: 'Closes Later', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
  closed:   { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' },
} as const;
