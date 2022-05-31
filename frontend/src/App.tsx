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
    <>
      <div className="bg-dark-4 w-screen h-screen flex flex-col">
        <div className="flex-none">
          <TopBar />
        </div>
        <div className="flex-auto flex">
          <div className="lg:w-7/12 flex-grow bg-dark-3 p-5">
            <SendMenu />
            <div className="border-b border-dark-7 my-5" />
            <Editor />
          </div>
          <div className="lg:w-5/12 flex-none hidden lg:block p-5">
            <Preview />
          </div>
        </div>
      </div>
      <div>
        <PreviewModal visible={previewModal} />
        <div
          className="lg:hidden fixed bottom-5 right-5 bg-blurple rounded-full h-12 w-12 shadow-xl flex items-center justify-center cursor-pointer"
          role="button"
          title="Preview"
          onClick={() => setPreviewModal(!previewModal)}
        >
          <EyeIcon className="text-white h-9 w-9" />
        </div>
      </div>
    </>
  );
}

export default App;
