/**
 * FilesTab - File inventory with filtering and sorting
 */
import { useState, useMemo } from 'react';
import {
  FILE_STATS,
  FILE_TYPE_CONFIG,
  AREA_CONFIG,
  SIZE_CONFIG,
  type Area,
  type SizeCategory,
  type FileType,
} from '../../data/codebaseHealthData';

export function FilesTab() {
  // File filters
  const [fileAreaFilter, setFileAreaFilter] = useState<Area[]>([]);
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType[]>([]);
  const [fileSizeFilter, setFileSizeFilter] = useState<SizeCategory[]>([]);
  const [fileSearch, setFileSearch] = useState('');
  const [fileSortBy, setFileSortBy] = useState<'path' | 'loc' | 'type' | 'area'>('loc');
  const [fileSortDir, setFileSortDir] = useState<'asc' | 'desc'>('desc');

  // Filtered files
  const filteredFiles = useMemo(() => {
    let files = [...FILE_STATS];

    if (fileAreaFilter.length > 0) {
      files = files.filter(f => fileAreaFilter.includes(f.area));
    }
    if (fileTypeFilter.length > 0) {
      files = files.filter(f => fileTypeFilter.includes(f.fileType));
    }
    if (fileSizeFilter.length > 0) {
      files = files.filter(f => fileSizeFilter.includes(f.sizeCategory));
    }
    if (fileSearch) {
      const search = fileSearch.toLowerCase();
      files = files.filter(f => f.path.toLowerCase().includes(search));
    }

    // Sort
    files.sort((a, b) => {
      let cmp = 0;
      switch (fileSortBy) {
        case 'path':
          cmp = a.path.localeCompare(b.path);
          break;
        case 'loc':
          cmp = a.loc - b.loc;
          break;
        case 'type':
          cmp = a.fileType.localeCompare(b.fileType);
          break;
        case 'area':
          cmp = a.area.localeCompare(b.area);
          break;
      }
      return fileSortDir === 'asc' ? cmp : -cmp;
    });

    return files;
  }, [fileAreaFilter, fileTypeFilter, fileSizeFilter, fileSearch, fileSortBy, fileSortDir]);

  // Toggle file sort
  const toggleSort = (column: typeof fileSortBy) => {
    if (fileSortBy === column) {
      setFileSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setFileSortBy(column);
      setFileSortDir('desc');
    }
  };

  // Toggle filter helpers
  const toggleAreaFilter = (area: Area) => {
    setFileAreaFilter(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const toggleTypeFilter = (type: FileType) => {
    setFileTypeFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSizeFilter = (size: SizeCategory) => {
    setFileSizeFilter(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  return (
    <section className="tab-content files-tab">
      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search files..."
          value={fileSearch}
          onChange={e => setFileSearch(e.target.value)}
          className="search-input"
        />

        <div className="filter-group">
          <span className="filter-label">Area:</span>
          <div className="filter-chips">
            {(Object.keys(AREA_CONFIG) as Area[]).map(area => (
              <button
                key={area}
                className={`filter-chip ${fileAreaFilter.includes(area) ? 'active' : ''}`}
                onClick={() => toggleAreaFilter(area)}
                style={fileAreaFilter.includes(area) ? { borderColor: AREA_CONFIG[area].color, color: AREA_CONFIG[area].color } : {}}
              >
                {AREA_CONFIG[area].label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Type:</span>
          <div className="filter-chips">
            {(Object.keys(FILE_TYPE_CONFIG) as FileType[]).map(type => (
              <button
                key={type}
                className={`filter-chip ${fileTypeFilter.includes(type) ? 'active' : ''}`}
                onClick={() => toggleTypeFilter(type)}
                style={fileTypeFilter.includes(type) ? { borderColor: FILE_TYPE_CONFIG[type].color, color: FILE_TYPE_CONFIG[type].color } : {}}
              >
                {FILE_TYPE_CONFIG[type].label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Size:</span>
          <div className="filter-chips">
            {(Object.keys(SIZE_CONFIG) as SizeCategory[]).map(size => (
              <button
                key={size}
                className={`filter-chip ${fileSizeFilter.includes(size) ? 'active' : ''}`}
                onClick={() => toggleSizeFilter(size)}
                style={fileSizeFilter.includes(size) ? { borderColor: SIZE_CONFIG[size].color, color: SIZE_CONFIG[size].color } : {}}
              >
                {SIZE_CONFIG[size].label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="results-count">
        Showing {filteredFiles.length} of {FILE_STATS.length} files
      </div>

      {/* File Table */}
      <div className="file-table-container">
        <table className="file-table">
          <thead>
            <tr>
              <th
                className={`sortable ${fileSortBy === 'path' ? 'sorted' : ''}`}
                onClick={() => toggleSort('path')}
              >
                Path {fileSortBy === 'path' && (fileSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className={`sortable ${fileSortBy === 'loc' ? 'sorted' : ''}`}
                onClick={() => toggleSort('loc')}
              >
                LOC {fileSortBy === 'loc' && (fileSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className={`sortable ${fileSortBy === 'type' ? 'sorted' : ''}`}
                onClick={() => toggleSort('type')}
              >
                Type {fileSortBy === 'type' && (fileSortDir === 'asc' ? '▲' : '▼')}
              </th>
              <th
                className={`sortable ${fileSortBy === 'area' ? 'sorted' : ''}`}
                onClick={() => toggleSort('area')}
              >
                Area {fileSortBy === 'area' && (fileSortDir === 'asc' ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredFiles.slice(0, 100).map(f => (
              <tr key={f.path} className={`size-row-${f.sizeCategory}`}>
                <td className="path-cell" title={f.path}>{f.path}</td>
                <td className={`loc-cell size-${f.sizeCategory}`}>{f.loc}</td>
                <td>
                  <span
                    className="type-badge"
                    style={{ color: FILE_TYPE_CONFIG[f.fileType].color }}
                  >
                    {FILE_TYPE_CONFIG[f.fileType].label}
                  </span>
                </td>
                <td>
                  <span
                    className="area-badge"
                    style={{ color: AREA_CONFIG[f.area].color }}
                  >
                    {AREA_CONFIG[f.area].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredFiles.length > 100 && (
          <div className="table-truncated">
            Showing first 100 of {filteredFiles.length} files. Use filters to narrow results.
          </div>
        )}
      </div>
    </section>
  );
}
