import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "./api/client";
import { BrowserRouter } from "react-router-dom";
import { baseUrl } from "./util/url";
import AnalyticsProvider from "./components/AnalyticsProvider";
import { seedDocumentStore } from "./state/currentMessage";

seedDocumentStore();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={baseUrl}>
        <App />
        <AnalyticsProvider />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
