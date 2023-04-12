import { Outlet } from "react-router-dom";
import EditorMessageContentFields from "../../components/EditorMessageContentFields";
import EditorEmbedsSection from "../../components/EditorEmbedsSection";
import EditorMenuBar from "../../components/EditorMenuBar";
import EditorMessagePreview from "../../components/EditorMessagePreview";

export default function EditorView() {
  return (
    <div className="flex flex-col lg:flex-row h-full">
      <div className="lg:w-1/2 lg:h-full bg-dark-4">
        <EditorMenuBar />
        <div className="p-5 space-y-5">
          <EditorMessageContentFields />
          <EditorEmbedsSection />
        </div>
      </div>
      <div className="lg:w-1/2 lg:h-full bg-dark-4 border-t-2 lg:border-t-0 lg:border-l-2 border-dark-3 px-5 py-2 lg:overflow-y-auto">
        <EditorMessagePreview />
      </div>
      <Outlet />
    </div>
  );
}
