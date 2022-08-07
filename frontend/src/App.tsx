import TopBar from "./components/TopBar";
import SendMenu from "./components/SendMenu";
import Preview from "./components/Preview";
import Editor from "./components/Editor";
import { EyeIcon } from "@heroicons/react/outline";
import PreviewModal from "./components/PreviewModal";
import { useState } from "react";
import PrivacyPolicyModal from "./components/PrivacyPolicyModal";
import TermsModal from "./components/TermsModal";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

function App() {
  const [previewModal, setPreviewModal] = useState(false);
  const [privacyPolicyModal, setPrivacyPolicyModal] = useState(false);
  const [termsModal, setTermsModal] = useState(false);

  return (
    <div>
      <div className="bg-dark-4 w-screen h-screen flex flex-col text-gray-100">
        <div className="flex-none">
          <TopBar />
        </div>
        <div className="flex-auto flex overflow-hidden">
          <div className="lg:w-7/12 flex-grow border-r-2 border-dark-3 overflow-y-hidden">
            <SimpleBar className="max-h-full">
              <div className="flex flex-col p-3 md:p-5">
                <SendMenu />
                <div className="border-b border-gray-600 my-5" />
                <Editor />
                <div className="mt-10">
                  <div className="flex mb-2 space-x-4">
                    <div
                      className="cursor-pointer text-gray-300 hover:text-white"
                      onClick={() => setPrivacyPolicyModal(true)}
                    >
                      Privacy Policy
                    </div>
                    <div
                      className="cursor-pointer text-gray-300 hover:text-white"
                      onClick={() => setTermsModal(true)}
                    >
                      Terms of Service
                    </div>
                  </div>
                  <div className="text-gray-300 text-sm">
                    © 2020 Merlin Fuchs & Contributors
                  </div>
                </div>
              </div>
            </SimpleBar>
          </div>
          <div className="lg:w-5/12 flex-none hidden lg:block overflow-y-hidden">
            <SimpleBar className="max-h-full">
              <div className="pl-4 pr-10">
                <Preview />
              </div>
            </SimpleBar>
          </div>
        </div>
      </div>
      <div>
        <PreviewModal visible={previewModal} setVisible={setPreviewModal} />
        <div
          className="lg:hidden fixed bottom-5 right-5 bg-blurple rounded-full h-12 w-12 shadow-xl flex items-center justify-center cursor-pointer z-10"
          role="button"
          title="Preview"
          onClick={() => setPreviewModal(!previewModal)}
        >
          <EyeIcon className="text-white h-9 w-9" />
        </div>
      </div>

      <PrivacyPolicyModal
        visible={privacyPolicyModal}
        setVisible={setPrivacyPolicyModal}
      />
      <TermsModal visible={termsModal} setVisible={setTermsModal} />
    </div>
  );
}

export default App;
