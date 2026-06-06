import { ReactNode } from "react"
import { CssBaseline, ThemeProvider } from "@mui/material"
import { darkTheme } from "./theme"

export const Providers = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
)
