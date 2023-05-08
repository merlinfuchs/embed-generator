import { lazy, ReactNode, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "./util/toasts";
import EditorView from "./views/editor/editor";
import RequestLoadingIndicator from "./components/RequestLoadingIndicator";
import SendView from "./views/editor/send";
import ClearView from "./views/editor/clear";
import ShareView from "./views/editor/share";

const LazyJsonView = lazy(() => import("./views/editor/json"));
const LazyMagicView = lazy(() => import("./views/editor/magic"));
const LazyMessagesView = lazy(() => import("./views/editor/messages"));
const LazyPremiumView = lazy(() => import("./views/editor/premium"));

function SuspendedView({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}

function App() {
  return (
    <div className="h-screen w-screen overflow-y-auto">
      <RequestLoadingIndicator />
      <Routes>
        <Route path="/" element={<EditorView />}>
          <Route path="/send" element={<SendView />} />
          <Route path="/clear" element={<ClearView />} />
          <Route path="/share" element={<ShareView />} />
          <Route
            path="/messages"
            element={
              <SuspendedView>
                <LazyMessagesView />
              </SuspendedView>
            }
          />
          <Route
            path="/magic"
            element={
              <SuspendedView>
                <LazyMagicView />
              </SuspendedView>
            }
          />
          <Route
            path="/json"
            element={
              <SuspendedView>
                <LazyJsonView />
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
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
      <ToastContainer />
    </div>
  );
}

export default App;
