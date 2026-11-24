import React, { Component, type ReactNode } from "react"
import log from "electron-log/renderer"
import { invoke } from "../lib/electron"
import Button from "./ui/button"
import TitleBar from "./titlebar"
import useLanguageStore from "../store/languageStore"

const GITHUB_ISSUES = "https://github.com/VictorSallesBz/AGB/issues/new?template=bug.yml"

type Props = {
  children: ReactNode
}

type State = {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    log.error("React Error Boundary caught an error:", error, errorInfo)
  }

  handleOpenLogFolder = async () => {
    await invoke({ channel: "open-log-folder" })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorMessage =
        this.state.error instanceof Error ? this.state.error.message : String(this.state.error)
      const errorStack = this.state.error instanceof Error ? this.state.error.stack : undefined

      return (
        <div className="flex flex-col h-screen bg-agb-bg text-agb-text items-center justify-center p-8">
          <TitleBar />
          <div className="max-w-xl w-full rounded-2xl border border-agb-border bg-agb-card p-8">
            <h1 className="text-2xl font-semibold text-red-500 mb-2">
              {useLanguageStore.getState().language === "pt" ? "Algo deu errado" : "Something went wrong"}
            </h1>
            <p className="text-agb-text-secondary mb-4">
              {useLanguageStore.getState().language === "pt"
                ? "Ocorreu um erro inesperado no aplicativo. Por favor, ajude-nos a corrigir relatando este problema."
                : "An unexpected error occurred in the application. Please help us fix it by reporting this issue."}
            </p>
            <pre className="mb-6 p-4 rounded-lg bg-agb-accent text-xs text-agb-text overflow-x-auto overflow-y-auto max-h-40 border border-agb-border select-all">
              {errorMessage}
              {errorStack && `\n\n${errorStack}`}
            </pre>
            <div className="flex flex-wrap gap-3 mb-6">
              <Button variant="primary" onClick={this.handleOpenLogFolder} size="md">
                {useLanguageStore.getState().language === "pt" ? "Abrir Pasta de Logs" : "Open Log Folder"}
              </Button>
              <Button variant="secondary" onClick={this.handleRetry} size="md">
                {useLanguageStore.getState().language === "pt" ? "Tentar Novamente" : "Try Again"}
              </Button>
            </div>
            <p className="text-sm text-agb-text-muted">
              {useLanguageStore.getState().language === "pt" ? (
                <>
                  Por favor,{" "}
                  <a
                    href={GITHUB_ISSUES}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-agb-primary hover:underline"
                  >
                    crie uma issue no GitHub
                  </a>{" "}
                  para que possamos resolver o problema.
                </>
              ) : (
                <>
                  Please{" "}
                  <a
                    href={GITHUB_ISSUES}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-agb-primary hover:underline"
                  >
                    create a GitHub issue
                  </a>{" "}
                  so we can fix it.
                </>
              )}
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
