import { Component, ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: 16,
          background: '#0D0F12', color: '#E2E8F0', fontFamily: 'Inter, sans-serif',
          padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Something went wrong</h1>
          <p style={{ color: '#8892A0', fontSize: 14, maxWidth: 400, lineHeight: 1.6 }}>
            An unexpected error occurred. Please refresh the page or contact support if the problem persists.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/' }}
            style={{
              marginTop: 8, padding: '10px 22px', background: '#3B82F6', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14,
            }}
          >
            Back to Home
          </button>
          {import.meta.env.DEV && this.state.error && (
            <pre style={{
              marginTop: 16, padding: 16, background: '#131619', borderRadius: 8,
              fontSize: 11, color: '#EF4444', maxWidth: 600, textAlign: 'left',
              overflow: 'auto', border: '1px solid rgba(239,68,68,0.2)',
            }}>
              {this.state.error.message}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
