import { type ReactNode, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "./util/toasts";
import EditorView from "./views/editor/editor";
import RequestLoadingIndicator from "./components/RequestLoadingIndicator";
import LegacyPanelRoute from "./views/editor/legacyPanelRoute";
import EditorSideNav from "./components/SideNav";
import MobileBottomBar from "./components/MobileBottomBar";
import UpsellPopup from "./components/UpsellPopup";
import ConfirmOnExit from "./components/ConfirmOnExit";
import LoginErrorHandler from "./components/LoginErrorHandler";
import { lazyView } from "./util/lazyView";

const LazyMessagesView = lazyView(() => import("./views/messages"));
const LazyPremiumView = lazyView(() => import("./views/premium"));
const LazyShareRestoreView = lazyView(
  () => import("./views/editor/shareRestore"),
);
const LazyDataRestoreView = lazyView(
  () => import("./views/editor/dataRestore"),
);
const LazySettingsView = lazyView(() => import("./views/settings"));
const LazyCommandsView = lazyView(() => import("./views/commands"));
const LazyFormsView = lazyView(() => import("./views/forms"));
const LazyScheduledMessagesView = lazyView(() => import("./views/scheduled"));
const LazyToolsView = lazyView(() => import("./views/tools"));
const LazyColoredTextToolView = lazyView(
  () => import("./views/tools/coloredText"),
);
const LazyWebhookInfoToolView = lazyView(
  () => import("./views/tools/webhookInfo"),
);
const LazyEmbedLinksToolView = lazyView(
  () => import("./views/tools/embedLinks"),
);
const LazyTimestampsToolView = lazyView(
  () => import("./views/tools/timestamps"),
);
const LazySnowflakeToolView = lazyView(() => import("./views/tools/snowflake"));

function SuspendedView({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}

function App() {
  return (
    <div className="h-[100dvh] w-[100dvw] overflow-y-auto">
      <RequestLoadingIndicator />
      <UpsellPopup />
      <ConfirmOnExit />
      <LoginErrorHandler />
      {/* Room for the bottom bar on screens without the sidebar. */}
      <div className="flex h-full pb-[calc(3.75rem+env(safe-area-inset-bottom))] lg:pb-0">
        <EditorSideNav />
        <Routes>
          <Route path="/editor" element={<EditorView />}>
            {/* The panels open without changing the URL now. */}
            <Route path="new" element={<LegacyPanelRoute panel="new" />} />
            <Route path="json" element={<LegacyPanelRoute panel="json" />} />
            <Route
              path="assistant"
              element={<LegacyPanelRoute panel="assistant" />}
            />
            <Route path="share" element={<LegacyPanelRoute panel="share" />} />
            <Route
              path="settings"
              element={<LegacyPanelRoute panel="settings" />}
            />
            <Route
              path="open"
              element={
                <SuspendedView>
                  <LazyDataRestoreView />
                </SuspendedView>
              }
            />
            <Route
              path="share/:sharedMessageId"
              element={
                <SuspendedView>
                  <LazyShareRestoreView />
                </SuspendedView>
              }
            />
          </Route>
          <Route
            path="/messages"
            element={
              <SuspendedView>
                <LazyMessagesView />
              </SuspendedView>
            }
          />
          <Route
            path="/commands"
            element={
              <SuspendedView>
                <LazyCommandsView />
              </SuspendedView>
            }
          />
          <Route
            path="/forms"
            element={
              <SuspendedView>
                <LazyFormsView />
              </SuspendedView>
            }
          />
          <Route
            path="/scheduled"
            element={
              <SuspendedView>
                <LazyScheduledMessagesView />
              </SuspendedView>
            }
          />
          <Route
            path="/tools"
            element={
              <SuspendedView>
                <LazyToolsView />
              </SuspendedView>
            }
          />
          <Route
            path="/tools/colored-text"
            element={
              <SuspendedView>
                <LazyColoredTextToolView />
              </SuspendedView>
            }
          />
          <Route
            path="/tools/webhook-info"
            element={
              <SuspendedView>
                <LazyWebhookInfoToolView />
              </SuspendedView>
            }
          />
          <Route
            path="/tools/embed-links"
            element={
              <SuspendedView>
                <LazyEmbedLinksToolView />
              </SuspendedView>
            }
          />
          <Route
            path="/tools/timestamps"
            element={
              <SuspendedView>
                <LazyTimestampsToolView />
              </SuspendedView>
            }
          />
          <Route
            path="/tools/snowflake"
            element={
              <SuspendedView>
                <LazySnowflakeToolView />
              </SuspendedView>
            }
          />
          <Route
            path="/premium"
            element={
              <SuspendedView>
                <LazyPremiumView />
              </SuspendedView>
            }
          />
          <Route
            path="/settings"
            element={
              <SuspendedView>
                <LazySettingsView />
              </SuspendedView>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                replace
                to={{
                  pathname: "/editor",
                  search: location.search,
                }}
              />
            }
          />
        </Routes>
      </div>
      <MobileBottomBar />
      <ToastContainer />
    </div>
  );
}

export default App;
