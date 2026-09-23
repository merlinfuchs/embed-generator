import { type ReactNode, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "./util/toasts";
import EditorView from "./views/editor/editor";
import RequestLoadingIndicator from "./components/RequestLoadingIndicator";
import ClearView from "./views/editor/clear";
import ShareView from "./views/editor/share";
import EditorSideNav from "./components/SideNav";
import ActivityLoadingScreen from "./components/ActivityLoadingScreen";
import "./util/activity";
import UpsellPopup from "./components/UpsellPopup";
import ConfirmOnExit from "./components/ConfirmOnExit";
import LoginErrorHandler from "./components/LoginErrorHandler";
import { lazyView } from "./util/lazyView";

const LazyJsonView = lazyView(() => import("./views/editor/json"));
const LazyAssistantView = lazyView(() => import("./views/editor/assisstant"));
const LazyMessagesView = lazyView(() => import("./views/messages"));
const LazyPremiumView = lazyView(() => import("./views/premium"));
const LazyShareRestoreView = lazyView(
  () => import("./views/editor/shareRestore"),
);
const LazySettingsView = lazyView(() => import("./views/settings"));
const LazyCommandsView = lazyView(() => import("./views/commands"));
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

function SuspendedView({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}

function App() {
  return (
    <div className="h-[100dvh] w-[100dvw] overflow-y-auto">
      <RequestLoadingIndicator />
      <ActivityLoadingScreen />
      <UpsellPopup />
      <ConfirmOnExit />
      <LoginErrorHandler />
      <div className="flex h-full">
        <EditorSideNav />
        <Routes>
          <Route path="/editor" element={<EditorView />}>
            <Route path="clear" element={<ClearView />} />
            <Route
              path="json"
              element={
                <SuspendedView>
                  <LazyJsonView />
                </SuspendedView>
              }
            />
            <Route
              path="assistant"
              element={
                <SuspendedView>
                  <LazyAssistantView />
                </SuspendedView>
              }
            />

            <Route path="share" element={<ShareView />} />
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
      <ToastContainer />
    </div>
  );
}

export default App;
