import { Component } from 'react'
import type { ReactNode } from 'react'
export class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <main className="fatal">
        <h1>The workbench could not open.</h1>
        <p>
          Reload to recover. Unsynced local drafts remain in this browser when
          storage is available.
        </p>
        <button onClick={() => location.reload()}>Reload</button>
      </main>
    ) : (
      this.props.children
    )
  }
}
