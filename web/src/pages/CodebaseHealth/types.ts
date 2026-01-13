/**
 * CodebaseHealth type definitions and constants
 */
import type {
  RefactorItem,
  FileType,
  Area,
  SizeCategory,
  RefactorPriority,
  RefactorStatus,
} from '../../data/codebaseHealthData';

// Re-export data types
export type {
  RefactorItem,
  FileType,
  Area,
  SizeCategory,
  RefactorPriority,
  RefactorStatus,
};

// localStorage key for status overrides
export const STORAGE_KEY = 'codebase-health-status-overrides';

// Tab types
export type TabType = 'stats' | 'files' | 'todos';
