import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  err: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[SPA] uncaught', err, info);
  }

  render() {
    if (this.state.err) {
      return (
        <div className="spa-error" role="alert">
          <div className="spa-error__title">panic.</div>
          <div>The render flatlined. Reload to try again.</div>
          <div style={{ opacity: 0.5 }}>{String(this.state.err.message ?? this.state.err)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
