/**
 * DebugToast - Simple toast notification for debug actions
 */
import './DebugToast.css';

interface DebugToastProps {
  message: string | null;
  onDismiss?: () => void;
}

export function DebugToast({ message, onDismiss }: DebugToastProps) {
  if (!message) return null;

  return (
    <div className="debug-toast" onClick={onDismiss}>
      <span className="debug-toast-icon">🔧</span>
      <span className="debug-toast-message">{message}</span>
    </div>
  );
}
