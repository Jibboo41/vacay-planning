import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, EmptyState } from './ui';

interface Props {
  children: ReactNode;
  /** Label used in the fallback ("Timeline couldn't load"). */
  name?: string;
  /** Changing this value resets the boundary (e.g. the route path). */
  resetKey?: unknown;
}

interface State {
  error: Error | null;
  resetKey: unknown;
}

/**
 * Per-route error boundary: a crash in one screen shows a recoverable
 * fallback instead of taking down the whole app.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) return { error: null, resetKey: props.resetKey };
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="flex min-h-[60vh] flex-1 items-center justify-center p-6">
        <EmptyState
          icon={<AlertTriangle size={28} />}
          title={`${this.props.name ?? 'This screen'} couldn't load`}
          description={this.state.error.message || 'Something went wrong.'}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={this.reset}>Try again</Button>
              <Button variant="glass" onClick={() => window.location.reload()}>Reload app</Button>
            </div>
          }
        />
      </div>
    );
  }
}
