import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@lib/queryClient";
import { configureApiBaseUrl } from "@lib/axios";

configureApiBaseUrl();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <App />
      </Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
