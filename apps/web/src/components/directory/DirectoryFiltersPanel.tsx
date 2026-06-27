import {
  DEFAULT_DIRECTORY_FILTERS,
  type DirectoryAvailabilityFilter,
  type DirectoryFilters,
  type DirectorySort,
} from '@bandie/data';

type DirectoryFiltersPanelProps = {
  filters: DirectoryFilters;
  genres: string[];
  onChange: (filters: DirectoryFilters) => void;
  onReset: () => void;
};

export function DirectoryFiltersPanel({
  filters,
  genres,
  onChange,
  onReset,
}: DirectoryFiltersPanelProps) {
  function update<K extends keyof DirectoryFilters>(key: K, value: DirectoryFilters[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside className="directory-filters" id="filters" aria-label="Band directory filters">
      <h2>Filter bands</h2>
      <p className="directory-filters-intro">
        Narrow the directory by name, genre, location, price, or availability. Results update as you
        type.
      </p>

      <div className="directory-filter-group">
        <label htmlFor="nameFilter">Band name</label>
        <input
          id="nameFilter"
          type="search"
          placeholder="e.g. Skin Condition"
          value={filters.name}
          onChange={(event) => update('name', event.target.value)}
        />
      </div>

      <div className="directory-filter-group">
        <label htmlFor="genreFilter">Genre</label>
        <select
          id="genreFilter"
          value={filters.genre}
          onChange={(event) => update('genre', event.target.value)}
        >
          <option value="">Any genre</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div className="directory-filter-group">
        <label htmlFor="locationFilter">Location / area</label>
        <input
          id="locationFilter"
          type="search"
          placeholder="e.g. Surrey, London"
          value={filters.location}
          onChange={(event) => update('location', event.target.value)}
        />
      </div>

      <div className="directory-filter-group">
        <label>Price range (£)</label>
        <div className="directory-range-row">
          <input
            type="number"
            min={0}
            step={50}
            placeholder="Min"
            value={filters.minPrice ?? ''}
            onChange={(event) =>
              update('minPrice', event.target.value ? Number(event.target.value) : null)
            }
          />
          <input
            type="number"
            min={0}
            step={50}
            placeholder="Max"
            value={filters.maxPrice ?? ''}
            onChange={(event) =>
              update('maxPrice', event.target.value ? Number(event.target.value) : null)
            }
          />
        </div>
      </div>

      <div className="directory-filter-group">
        <label htmlFor="availabilityFilter">Availability</label>
        <select
          id="availabilityFilter"
          value={filters.availability}
          onChange={(event) =>
            update('availability', event.target.value as DirectoryAvailabilityFilter)
          }
        >
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="limited">Limited availability</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      {genres.length ? (
        <div className="directory-filter-group">
          <label>Quick genre picks</label>
          <div className="directory-genre-chips">
            {genres.slice(0, 6).map((genre) => (
              <button
                key={genre}
                type="button"
                className={`directory-chip ${filters.genre === genre ? 'active' : ''}`}
                onClick={() => update('genre', filters.genre === genre ? '' : genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="directory-filter-actions">
        <button type="button" className="directory-btn directory-btn-secondary" onClick={onReset}>
          Reset
        </button>
      </div>
    </aside>
  );
}

export function buildActiveFilterPills(filters: DirectoryFilters): string[] {
  const pills: string[] = [];
  if (filters.name.trim()) pills.push(`Name: ${filters.name.trim()}`);
  if (filters.genre) pills.push(`Genre: ${filters.genre}`);
  if (filters.location.trim()) pills.push(`Location: ${filters.location.trim()}`);
  if (filters.minPrice != null && filters.minPrice > 0) pills.push(`Min: £${filters.minPrice}`);
  if (filters.maxPrice != null) pills.push(`Max: £${filters.maxPrice}`);
  if (filters.availability) {
    pills.push(`Availability: ${filters.availability}`);
  }
  return pills;
}

type DirectorySortControlProps = {
  sort: DirectorySort;
  onChange: (sort: DirectorySort) => void;
};

export function DirectorySortControl({ sort, onChange }: DirectorySortControlProps) {
  return (
    <div className="directory-sort-control">
      <label htmlFor="sortSelect">Sort</label>
      <select
        id="sortSelect"
        value={sort}
        onChange={(event) => onChange(event.target.value as DirectorySort)}
      >
        <option value="recommended">Recommended</option>
        <option value="priceAsc">Price: low to high</option>
        <option value="priceDesc">Price: high to low</option>
        <option value="nameAsc">Name A–Z</option>
      </select>
    </div>
  );
}

export { DEFAULT_DIRECTORY_FILTERS };
