/**
 * Hook for fetching codebase health data from API with static fallback
 */
import { useState, useEffect, useCallback } from 'react';
import type {
  FileStats,
  RefactorItem,
  Area,
  FileType,
  SizeCategory,
  RefactorPriority,
  RefactorStatus,
} from '../data/codebaseHealthData';

// Import static data as fallback
import {
  FILE_STATS as STATIC_FILE_STATS,
  REFACTOR_TODOS as STATIC_REFACTOR_TODOS,
  GENERATED_AT as STATIC_GENERATED_AT,
} from '../data/codebaseHealthData';

const API_BASE = '/api/codebase-health';

interface FileStatsFilters {
  area?: Area;
  fileType?: FileType;
  sizeCategory?: SizeCategory;
  search?: string;
  sortBy?: 'path' | 'loc' | 'type' | 'area';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface TodoFilters {
  priority?: RefactorPriority;
  status?: RefactorStatus;
  search?: string;
}

interface FileStatsResponse {
  files: FileStats[];
  total: number;
  page: number;
  page_size: number;
}

interface TodosResponse {
  todos: RefactorItem[];
  total: number;
}

interface StatsResponse {
  total_files: number;
  total_loc: number;
  avg_loc: number;
  total_todos: number;
  generated_at: string | null;
  by_area: Record<string, { count: number; total_loc: number }>;
  by_priority: Record<string, number>;
}

/**
 * Hook for fetching file stats from API
 */
export function useFileStats(filters: FileStatsFilters = {}) {
  const [files, setFiles] = useState<FileStats[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.area) params.set('area', filters.area);
      if (filters.fileType) params.set('file_type', filters.fileType);
      if (filters.sizeCategory) params.set('size_category', filters.sizeCategory);
      if (filters.search) params.set('search', filters.search);
      if (filters.sortBy) params.set('sort_by', filters.sortBy);
      if (filters.sortDir) params.set('sort_dir', filters.sortDir);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.pageSize) params.set('page_size', filters.pageSize.toString());

      const response = await fetch(`${API_BASE}/files?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: FileStatsResponse = await response.json();
      setFiles(data.files);
      setTotal(data.total);
      setUsingFallback(false);
    } catch (err) {
      console.warn('API fetch failed, using static fallback:', err);
      // Fall back to static data
      let filteredFiles = [...STATIC_FILE_STATS];

      if (filters.area) {
        filteredFiles = filteredFiles.filter(f => f.area === filters.area);
      }
      if (filters.fileType) {
        filteredFiles = filteredFiles.filter(f => f.fileType === filters.fileType);
      }
      if (filters.sizeCategory) {
        filteredFiles = filteredFiles.filter(f => f.sizeCategory === filters.sizeCategory);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredFiles = filteredFiles.filter(f => f.path.toLowerCase().includes(search));
      }

      // Sort
      const sortBy = filters.sortBy || 'loc';
      const sortDir = filters.sortDir || 'desc';
      filteredFiles.sort((a, b) => {
        let cmp = 0;
        switch (sortBy) {
          case 'path': cmp = a.path.localeCompare(b.path); break;
          case 'loc': cmp = a.loc - b.loc; break;
          case 'type': cmp = a.fileType.localeCompare(b.fileType); break;
          case 'area': cmp = a.area.localeCompare(b.area); break;
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });

      // Paginate
      const page = filters.page || 1;
      const pageSize = filters.pageSize || 100;
      const start = (page - 1) * pageSize;
      const paginatedFiles = filteredFiles.slice(start, start + pageSize);

      setFiles(paginatedFiles);
      setTotal(filteredFiles.length);
      setUsingFallback(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [filters.area, filters.fileType, filters.sizeCategory, filters.search, filters.sortBy, filters.sortDir, filters.page, filters.pageSize]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return { files, total, loading, error, usingFallback, refetch: fetchFiles };
}

/**
 * Hook for fetching refactor todos from API
 */
export function useRefactorTodos(filters: TodoFilters = {}) {
  const [todos, setTodos] = useState<RefactorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.status) params.set('status', filters.status);
      if (filters.search) params.set('search', filters.search);

      const response = await fetch(`${API_BASE}/todos?${params}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: TodosResponse = await response.json();
      setTodos(data.todos);
      setTotal(data.total);
      setUsingFallback(false);
    } catch (err) {
      console.warn('API fetch failed, using static fallback:', err);
      // Fall back to static data
      let filteredTodos = [...STATIC_REFACTOR_TODOS];

      if (filters.priority) {
        filteredTodos = filteredTodos.filter(t => t.priority === filters.priority);
      }
      if (filters.status) {
        filteredTodos = filteredTodos.filter(t => t.status === filters.status);
      }
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredTodos = filteredTodos.filter(t =>
          t.title.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search)
        );
      }

      setTodos(filteredTodos);
      setTotal(filteredTodos.length);
      setUsingFallback(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [filters.priority, filters.status, filters.search]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  return { todos, total, loading, error, usingFallback, refetch: fetchTodos };
}

/**
 * Hook for fetching codebase stats from API
 */
export function useCodebaseStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/stats`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: StatsResponse = await response.json();
      setStats(data);
      setUsingFallback(false);
    } catch (err) {
      console.warn('API fetch failed, using static fallback:', err);
      // Calculate stats from static data
      const byArea: Record<string, { count: number; total_loc: number }> = {};
      for (const file of STATIC_FILE_STATS) {
        if (!byArea[file.area]) {
          byArea[file.area] = { count: 0, total_loc: 0 };
        }
        byArea[file.area].count++;
        byArea[file.area].total_loc += file.loc;
      }

      const byPriority: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
      for (const todo of STATIC_REFACTOR_TODOS) {
        byPriority[todo.priority] = (byPriority[todo.priority] || 0) + 1;
      }

      const totalLoc = STATIC_FILE_STATS.reduce((sum, f) => sum + f.loc, 0);

      setStats({
        total_files: STATIC_FILE_STATS.length,
        total_loc: totalLoc,
        avg_loc: Math.round(totalLoc / STATIC_FILE_STATS.length),
        total_todos: STATIC_REFACTOR_TODOS.length,
        generated_at: STATIC_GENERATED_AT,
        by_area: byArea,
        by_priority: byPriority,
      });
      setUsingFallback(true);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, usingFallback, refetch: fetchStats };
}
