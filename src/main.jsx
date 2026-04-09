import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('[XPS ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#08090c', color: '#e2e8f0',
          fontFamily: "'Inter', sans-serif", padding: 40,
        }}>
          <div style={{ maxWidth: 520, width: '100%' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#ef4444' }}>
              XPS Platform Error
            </h2>
            <p style={{ color: 'rgba(226,232,240,0.6)', marginBottom: 20, fontSize: 14 }}>
              The platform encountered an unexpected error. This may be due to a missing dependency or configuration issue.
            </p>
            <pre style={{
              background: '#111318', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8, padding: '14px 16px',
              color: '#ef4444', fontSize: 12, whiteSpace: 'pre-wrap',
              wordBreak: 'break-word', marginBottom: 20,
            }}>
              {this.state.error.message}
            </pre>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              style={{
                background: '#c49e3c', color: '#0a0b0c', border: 'none',
                borderRadius: 8, padding: '10px 20px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}
            >
              Reload Platform
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
