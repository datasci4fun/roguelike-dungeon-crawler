/**
 * ErrorBoundary - React error boundary for graceful failure handling
 *
 * Wraps components to catch JavaScript errors anywhere in their child
 * component tree, log those errors, and display a fallback UI instead
 * of crashing the whole application.
 */
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** Name of the boundary for logging purposes */
  name?: string;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Whether to show a recovery button */
  showRecovery?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    const boundaryName = this.props.name || 'Unknown';
    console.error(`[ErrorBoundary:${boundaryName}] Caught error:`, error);
    console.error(`[ErrorBoundary:${boundaryName}] Component stack:`, errorInfo.componentStack);

    // Store error info for display
    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to any external error tracking service here
    // Example: logErrorToService(error, errorInfo, boundaryName);
  }

  handleRecovery = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Return custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          name={this.props.name}
          showRecovery={this.props.showRecovery}
          onRecovery={this.handleRecovery}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI component
 */
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  name?: string;
  showRecovery?: boolean;
  onRecovery: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  name,
  showRecovery = true,
  onRecovery,
}: DefaultErrorFallbackProps): JSX.Element {
  const isDev = import.meta.env.DEV;

  return (
    <div
      style={{
        padding: '2rem',
        margin: '1rem',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #ff4444',
        borderRadius: '8px',
        color: '#ff9999',
        fontFamily: '"Courier New", monospace',
        maxWidth: '100%',
        overflow: 'auto',
      }}
    >
      <h2 style={{ color: '#ff4444', marginBottom: '1rem' }}>
        Something went wrong{name ? ` in ${name}` : ''}
      </h2>

      <p style={{ color: '#cccccc', marginBottom: '1rem' }}>
        An unexpected error occurred. The application has been partially recovered.
      </p>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(255, 68, 68, 0.1)',
            padding: '1rem',
            borderRadius: '4px',
            marginBottom: '1rem',
          }}
        >
          <strong style={{ color: '#ff6666' }}>Error: </strong>
          <span>{error.message}</span>
        </div>
      )}

      {isDev && errorInfo && (
        <details style={{ marginBottom: '1rem' }}>
          <summary style={{ cursor: 'pointer', color: '#888888' }}>
            Component Stack (Development Only)
          </summary>
          <pre
            style={{
              fontSize: '0.75rem',
              whiteSpace: 'pre-wrap',
              color: '#666666',
              marginTop: '0.5rem',
              maxHeight: '200px',
              overflow: 'auto',
            }}
          >
            {errorInfo.componentStack}
          </pre>
        </details>
      )}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {showRecovery && (
          <button
            onClick={onRecovery}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#334433',
              color: '#88ff88',
              border: '1px solid #88ff88',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try Again
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#333344',
            color: '#8888ff',
            border: '1px solid #8888ff',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reload Page
        </button>

        <button
          onClick={() => (window.location.href = '/')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#443333',
            color: '#ffcc88',
            border: '1px solid #ffcc88',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

/**
 * Specialized error boundary for 3D/WebGL components
 * Shows a more specific message for graphics-related errors
 */
export class Graphics3DErrorBoundary extends ErrorBoundary {
  render(): ReactNode {
    if (this.state.hasError) {
      // Return custom fallback for 3D errors
      return (
        <div
          style={{
            padding: '2rem',
            margin: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid #ff8844',
            borderRadius: '8px',
            color: '#ffcc99',
            fontFamily: '"Courier New", monospace',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#ff8844', marginBottom: '1rem' }}>
            3D Rendering Error
          </h2>

          <p style={{ color: '#cccccc', marginBottom: '1rem' }}>
            The 3D graphics could not be rendered. This may be due to:
          </p>

          <ul
            style={{
              textAlign: 'left',
              display: 'inline-block',
              color: '#aaaaaa',
              marginBottom: '1rem',
            }}
          >
            <li>WebGL not supported by your browser</li>
            <li>Graphics driver issues</li>
            <li>GPU memory limitations</li>
            <li>Browser hardware acceleration disabled</li>
          </ul>

          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#333344',
                color: '#8888ff',
                border: '1px solid #8888ff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginRight: '1rem',
              }}
            >
              Reload Page
            </button>

            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#443333',
                color: '#ffcc88',
                border: '1px solid #ffcc88',
                borderRadius: '4px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
