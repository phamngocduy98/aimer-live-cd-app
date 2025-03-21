declare global {
  interface Window {
    electronAPI: {
      getPort: () => Promise<number>;
      submitPassword: (password: string) => void;
    };
  }
}
