import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="eb-wrapper">
          <div className="eb-card">
            <div className="eb-icon">{'\u26A0'}</div>
            <h2 className="eb-title">Something went wrong</h2>
            <p className="eb-desc">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Refresh Page
            </button>
            <style>{ebStyles}</style>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ebStyles = `
.eb-wrapper {
  display: flex; align-items: center; justify-content: center;
  min-height: 60vh; padding: 2rem;
}
.eb-card { text-align: center; max-width: 400px; }
.eb-icon { font-size: 2.5rem; margin-bottom: 0.75rem; line-height: 1; }
.eb-title {
  font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem;
  color: var(--text-primary);
}
.eb-desc {
  font-size: 0.9rem; color: var(--text-secondary);
  margin-bottom: 1.25rem; line-height: 1.5;
}
`;
