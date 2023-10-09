import { lazy, ReactNode, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "./util/toasts";
import EditorView from "./views/editor/editor";
import RequestLoadingIndicator from "./components/RequestLoadingIndicator";
import ClearView from "./views/editor/clear";
import ShareView from "./views/editor/share";
import EditorSideNav from "./components/SideNav";

const LazyJsonView = lazy(() => import("./views/editor/json"));
const LazyAssistantView = lazy(() => import("./views/editor/assisstant"));
const LazyMessagesView = lazy(() => import("./views/messages"));
const LazyPremiumView = lazy(() => import("./views/premium"));
const LazyShareRestoreView = lazy(() => import("./views/editor/shareRestore"));
const LazySettingsView = lazy(() => import("./views/settings"));
const LazyCommandsView = lazy(() => import("./views/commands"));

function SuspendedView({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}

function App() {
  return (
    <div className="h-[100dvh] w-[100dvw] overflow-y-auto">
      <RequestLoadingIndicator />
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

          <Route path="*" element={<Navigate replace to="/editor" />} />
        </Routes>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App;
