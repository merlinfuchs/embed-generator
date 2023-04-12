import { lazy, ReactNode, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { ToastContainer } from "./util/toasts";
import EditorView from "./views/editor/editor";
import MagicView from "./views/editor/magic";
import MessagesView from "./views/editor/messages";
import SendView from "./views/editor/send";

const LazyJsonView = lazy(() => import("./views/editor/json"));

function SuspendedView({ children }: { children: ReactNode }) {
  return <Suspense>{children}</Suspense>;
}

function App() {
  return (
    <div className="h-screen w-screen overflow-y-auto">
      <Routes>
        <Route path="/" element={<EditorView />}>
          <Route path="/messages" element={<MessagesView />} />
          <Route path="/send" element={<SendView />} />
          <Route path="/magic" element={<MagicView />} />
          <Route
            path="/json"
            element={
              <SuspendedView>
                <LazyJsonView />
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
