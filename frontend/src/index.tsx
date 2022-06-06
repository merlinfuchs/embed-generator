import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { TokenProvider } from "./hooks/useToken";
import { UserProvider } from "./hooks/useUser";
import { SelectedModeProvider } from "./hooks/useSelectedMode";
import { MessageProvider } from "./hooks/useMessage";
import { GuildsProvider } from "./hooks/useGuilds";
import { SelectedGuildProvider } from "./hooks/useSelectedGuild";
import { MessagesProvider } from "./hooks/useMessages";
import { AlertsProvider } from "./hooks/useAlerts";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <AlertsProvider>
      <TokenProvider>
        <UserProvider>
          <MessagesProvider>
            <GuildsProvider>
              <SelectedGuildProvider>
                <SelectedModeProvider>
                  <MessageProvider>
                    <App />
                  </MessageProvider>
                </SelectedModeProvider>
              </SelectedGuildProvider>
            </GuildsProvider>
          </MessagesProvider>
        </UserProvider>
      </TokenProvider>
    </AlertsProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
