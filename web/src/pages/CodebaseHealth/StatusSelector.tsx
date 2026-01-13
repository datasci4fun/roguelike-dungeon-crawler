/**
 * StatusSelector - Dropdown component for changing refactor item status
 */
import { useState } from 'react';
import {
  REFACTOR_STATUS_CONFIG,
  type RefactorStatus,
} from '../../data/codebaseHealthData';

interface StatusSelectorProps {
  currentStatus: RefactorStatus;
  onStatusChange: (itemId: string, status: RefactorStatus) => void;
  itemId: string;
}

export function StatusSelector({
  currentStatus,
  onStatusChange,
  itemId,
}: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="status-selector">
      <button
        className={`status-selector-btn status-${currentStatus}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ color: REFACTOR_STATUS_CONFIG[currentStatus].color }}
      >
        {REFACTOR_STATUS_CONFIG[currentStatus].icon} {REFACTOR_STATUS_CONFIG[currentStatus].label}
        <span className="status-dropdown-arrow">▼</span>
      </button>
      {isOpen && (
        <div className="status-dropdown">
          {(Object.keys(REFACTOR_STATUS_CONFIG) as RefactorStatus[]).map((status) => (
            <button
              key={status}
              className={`status-option ${status === currentStatus ? 'active' : ''}`}
              onClick={() => {
                onStatusChange(itemId, status);
                setIsOpen(false);
              }}
              style={{ color: REFACTOR_STATUS_CONFIG[status].color }}
            >
              {REFACTOR_STATUS_CONFIG[status].icon} {REFACTOR_STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
