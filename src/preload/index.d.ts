declare global {
  interface Window {
    electronAPI: {
      getApiBaseUrl: () => Promise<string>;
      getStreamBaseUrl: () => Promise<string>;
      storeAesPassword: (password: string) => Promise<void>;
      hasStoredAesPassword: () => Promise<boolean>;
      clearStoredAesPassword: () => Promise<void>;
    };
  }
}
