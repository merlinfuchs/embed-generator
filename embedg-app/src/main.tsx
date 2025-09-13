import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "react-query";
import queryClient from "./api/client";
import { BrowserRouter } from "react-router-dom";
import { baseUrl } from "./util/url";
import * as swetrix from "swetrix";

document.addEventListener("DOMContentLoaded", () => {
  swetrix.init("GAvFu5AdIuRx", {
    apiURL: `https://swetrix.vaven.io/log`,
  });
  swetrix.trackViews();
  swetrix.trackErrors({
    sampleRate: 1,
    callback: () => {
      return true;
    },
  });
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={baseUrl}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
