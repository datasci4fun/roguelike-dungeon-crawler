/**
 * Codebase Health Page - File statistics, refactor todos, and code health metrics
 *
 * Features:
 * - Stats dashboard with summary metrics
 * - File inventory with filtering and sorting
 * - Refactor todo list with status tracking
 * - Edit mode for status changes (persisted to localStorage)
 */

import { useSearchParams } from 'react-router-dom';
import { AtmosphericPage } from '../components/AtmosphericPage';
import { PhosphorHeader } from '../components/PhosphorHeader';
import {
  FILE_STATS,
  REFACTOR_TODOS,
  GENERATED_AT,
} from '../data/codebaseHealthData';
import { StatsTab, FilesTab, TodosTab, Legend, type TabType } from './CodebaseHealth/index';
import './CodebaseHealth.css';

export function CodebaseHealth() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state
  const activeTab = (searchParams.get('tab') as TabType) || 'stats';

  // Tab switching
  const setActiveTab = (tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  return (
    <AtmosphericPage
      backgroundType="underground"
      particles={{ type: 'dust', count: 15, speed: 'slow', opacity: 0.15 }}
      crt={true}
      crtIntensity="light"
    >
      <div className="health-page">
        {/* Header */}
        <section className="health-hero">
          <PhosphorHeader
            title="CODEBASE HEALTH"
            subtitle="Repository analysis and refactoring"
            style="dramatic"
            delay={100}
          />
          <p className="hero-tagline">
            Monitor code quality, identify large files, and track refactoring tasks.
            <span className="generated-at">Generated: {new Date(GENERATED_AT).toLocaleDateString()}</span>
          </p>
        </section>

        {/* Tab Navigation */}
        <nav className="health-tabs">
          <button
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button
            className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files ({FILE_STATS.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveTab('todos')}
          >
            Refactor ({REFACTOR_TODOS.length})
          </button>
        </nav>

        {/* Tab Content */}
        {activeTab === 'stats' && <StatsTab />}
        {activeTab === 'files' && <FilesTab />}
        {activeTab === 'todos' && <TodosTab />}

        {/* Legend */}
        <Legend />
      </div>
    </AtmosphericPage>
  );
}
