import BaseModal from "./BaseModal";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function TermsModal({ visible, setVisible }: Props) {
  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <div className="space-y-3 text-gray-100">
        <div className="text-lg">Terms of Service</div>
        <div className="font-light text-gray-300">
          <p className="mb-1">
            The service is provided on an "As-Is" basis and makes no
            representations or warranties as to the services provided.
          </p>
          <p className="mb-1">
            Access to any features or services may be changed or revoked at any
            point without further notice.
          </p>
          <p>
            The user must use the services and features in a lawful manner and
            must not violate any third-party rights. When interacting with any
            Discord related features the user must follow{" "}
            <a href="https://discord.com/terms" className="text-blurple">
              Discord's Terms of Service
            </a>
            .
          </p>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            className="border-2 border-dark-7 px-3 py-2 rounded transition-colors hover:bg-dark-6"
            onClick={() => setVisible(false)}
          >
            Close
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
