import TopBar from "./components/TopBar";
import SendMenu from "./components/SendMenu";
import Preview from "./components/Preview";
import Editor from "./components/Editor";
import { EyeIcon } from "@heroicons/react/outline";
import PreviewModal from "./components/PreviewModal";
import { useState } from "react";

function App() {
  const [previewModal, setPreviewModal] = useState(false);

  return (
    <div>
      <div className="bg-dark-4 w-screen h-screen flex flex-col text-gray-100">
        <div className="flex-none">
          <TopBar />
        </div>
        <div className="flex-auto flex overflow-hidden">
          <div className="lg:w-7/12 flex-grow p-3 md:p-5 border-r-2 border-dark-3 overflow-y-auto">
            <SendMenu />
            <div className="border-b border-gray-600 my-5" />
            <Editor />
          </div>
          <div className="lg:w-5/12 flex-none hidden lg:block overflow-y-auto">
            <Preview />
          </div>
        </div>
      </div>
      <div>
        <PreviewModal visible={previewModal} setVisible={setPreviewModal} />
        <div
          className="lg:hidden fixed bottom-5 right-5 bg-blurple rounded-full h-12 w-12 shadow-xl flex items-center justify-center cursor-pointer"
          role="button"
          title="Preview"
          onClick={() => setPreviewModal(!previewModal)}
        >
          <EyeIcon className="text-white h-9 w-9" />
        </div>
      </div>
    </div>
  );
}

export default App;
