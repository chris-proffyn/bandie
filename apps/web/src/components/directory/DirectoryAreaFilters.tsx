import {
  areaFilterLabel,
  regionsForCountryCode,
  type BandieCountry,
  type BandieRegion,
  type GeographyIndex,
} from '@bandie/data';
import { rememberDirectoryCountrySelection } from '../../lib/directoryAreaDefaults';

type DirectoryAreaFiltersProps = {
  countryCode: string;
  regionId: string;
  geography: GeographyIndex;
  loading?: boolean;
  onChange: (countryCode: string, regionId: string) => void;
};

export function DirectoryAreaFilters({
  countryCode,
  regionId,
  geography,
  loading = false,
  onChange,
}: DirectoryAreaFiltersProps) {
  const regions = countryCode ? regionsForCountryCode(countryCode, geography) : [];
  const selectedCountry = countryCode
    ? geography.countryByCode.get(countryCode)
    : null;

  function handleCountryChange(nextCountryCode: string) {
    rememberDirectoryCountrySelection(nextCountryCode);
    onChange(nextCountryCode, '');
  }

  function handleRegionChange(nextRegionId: string) {
    onChange(countryCode, nextRegionId);
  }

  return (
    <>
      <div className="directory-filter-group">
        <label htmlFor="countryFilter">Country</label>
        <select
          id="countryFilter"
          value={countryCode}
          disabled={loading}
          onChange={(event) => handleCountryChange(event.target.value)}
        >
          <option value="">All countries</option>
          {geography.countries.map((country: BandieCountry) => (
            <option key={country.id} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
        <p className="directory-field-hint">
          Defaults to your country when we can detect it. Choose &ldquo;All countries&rdquo; to browse
          everywhere.
        </p>
      </div>

      {selectedCountry && regions.length > 0 ? (
        <div className="directory-filter-group">
          <label htmlFor="regionFilter">Area</label>
          <select
            id="regionFilter"
            value={regionId}
            disabled={loading}
            onChange={(event) => handleRegionChange(event.target.value)}
          >
            <option value="">All areas in {selectedCountry.name}</option>
            {regions.map((region: BandieRegion) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          <p className="directory-field-hint">
            Narrow results to a region. Listings without an assigned area still match when their
            location text fits.
          </p>
        </div>
      ) : null}
    </>
  );
}

export function buildAreaFilterPill(
  filters: { countryCode: string; regionId: string },
  geography: GeographyIndex,
): string | null {
  const label = areaFilterLabel(filters, geography);
  if (!label) {
    return null;
  }

  if (filters.regionId) {
    return `Area: ${label}`;
  }

  return `Country: ${label}`;
}
