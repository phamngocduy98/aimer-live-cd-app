import { Component, type ReactNode } from "react"
import { Box, Typography } from "@mui/material"

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error): void {
    console.error("ErrorBoundary caught:", error)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Box sx={{ p: 4 }}>
          <Typography variant="h5" color="error">
            Something went wrong
          </Typography>
          <Typography variant="body2">{this.state.error.message}</Typography>
        </Box>
      )
    }
    return this.props.children
  }
}
