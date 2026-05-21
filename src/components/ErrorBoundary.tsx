import { Component, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

/**
 * Top-level error boundary. If something inside the Canvas tree throws,
 * we show a clean fallback panel instead of a blank cream page.
 *
 * R3F itself surfaces a similar warning via `defaultOnUncaughtError`,
 * but the warning is easy to miss — this boundary turns it into a
 * visible message and a "reload" affordance.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.error('Studio Panic Attack — uncaught error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            textAlign: 'center',
            color: '#1a1814',
            background: '#f5efe4',
            fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
            zIndex: 100,
          }}
        >
          <div style={{ maxWidth: 460 }}>
            <div
              style={{
                fontSize: 11,
                letterSpacing: '0.3em',
                marginBottom: 16,
                color: '#5a5450',
              }}
            >
              STUDIO PANIC ATTACK
            </div>
            <div
              style={{
                fontFamily: 'Times New Roman, Georgia, serif',
                fontSize: 28,
                lineHeight: 1.1,
                marginBottom: 18,
              }}
            >
              Something broke in the scene.
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#5a5450',
                marginBottom: 24,
              }}
            >
              {this.state.error.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#1a1814',
                color: '#f5efe4',
                border: 'none',
                padding: '12px 24px',
                fontSize: 11,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
