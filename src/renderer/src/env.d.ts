/// <reference types="vite/client" />

interface Window {
  electronAPI?: {
    getPort: () => Promise<number>
    submitPassword: (password: string) => void
  }
}
