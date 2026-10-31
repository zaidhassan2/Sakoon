import { CONFIG } from './config.js';

let cachedHelplines = null;

/**
 * Pure function to extract and filter country helpline data.
 * Only entries with `show === true` are returned.
 * Never returns any entry where `show !== true`.
 */
export function filterVisibleHelplines(helplinesData, countryCode = CONFIG.defaultCountry) {
  if (!helplinesData || typeof helplinesData !== 'object') {
    return {
      isOther: true,
      countryCode: 'OTHER',
      countryName: '',
      lastVerified: '',
      emergency: null,
      lines: [],
      directoryUrl: 'https://findahelpline.com',
    };
  }

  const directoryUrl =
    typeof helplinesData.directory === 'string'
      ? helplinesData.directory
      : helplinesData.directory?.url || 'https://findahelpline.com';

  const countries = helplinesData.countries || {};

  if (countryCode === 'OTHER' || !countries[countryCode]) {
    return {
      isOther: true,
      countryCode: 'OTHER',
      countryName: 'Another country',
      lastVerified: helplinesData.lastVerified || '',
      emergency: null,
      lines: [],
      directoryUrl,
    };
  }

  const countryObj = countries[countryCode];
  const emergency =
    countryObj.emergency && countryObj.emergency.show === true && countryObj.emergency.number
      ? {
          name: countryObj.emergency.name,
          number: String(countryObj.emergency.number),
          hours: countryObj.emergency.hours || '',
        }
      : null;

  const lines = Array.isArray(countryObj.lines)
    ? countryObj.lines
        .filter((line) => line && line.show === true && line.number)
        .map((line) => ({
          id: line.id || line.name,
          name: line.name,
          number: String(line.number),
          hours: line.hours || '',
        }))
    : [];

  return {
    isOther: false,
    countryCode,
    countryName: countryObj.name || countryCode,
    lastVerified: countryObj.lastVerified || helplinesData.lastVerified || '',
    emergency,
    lines,
    directoryUrl,
  };
}

export function getAvailableCountries(helplinesData) {
  if (!helplinesData?.countries) return [];
  return Object.entries(helplinesData.countries).map(([code, data]) => ({
    code,
    name: data.name || code,
  }));
}

export async function loadHelplines() {
  if (cachedHelplines) return cachedHelplines;
  const response = await fetch(CONFIG.helplinesPath, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Could not load helplines.json');
  }
  cachedHelplines = await response.json();
  return cachedHelplines;
}
