import BaseModal from "./BaseModal";

interface Props {
  visible: boolean;
  setVisible: (visible: boolean) => void;
}

export default function PrivacyPolicyModal({ visible, setVisible }: Props) {
  return (
    <BaseModal visible={visible} setVisible={setVisible} size="large">
      <div className="space-y-3 text-gray-100">
        <div className="text-lg">Privacy Policy</div>

        <div className="text-gray-300 font-light space-y-4">
          <div>
            <div className="font-medium mb-1">Information we collect</div>
            <p>
              When you visit our webite, we collect basic log data about your
              request: IP-Address, User-Agent, and request time. If you log in
              with your Discord account we will store basic information about
              your Discord account like the username and avatar. If you save a
              message on our server we will store the name, description, and
              message.
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">Use of information</div>
            <p>
              We may collect, hold, use and disclose information for the
              following purposes and personal information will not be further
              processed in a manner that is incompatible with these purposes: to
              provide you with our platform’s core features; to enable you to
              access and use our service and associated applications; for
              internal record keeping and administrative purposes; to operate
              and improve our service, associated applications and associated
              sites; and to comply with our legal obligations and resolve any
              disputes that we may have.
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">Storage of information</div>
            <p>
              All data is stored in datacenters located in the USA with securety
              best-practices in mind. Requests may be routed to a global network
              of servers provided by Cloudfare. Cloudflare may store information
              about the request to protect our servers from potential attackers.
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">
              Your rights and controlling your personal information
            </div>
            <p>
              You may request details of the personal information that we hold
              about you. You may request a copy of the personal information we
              hold about you. Where possible, we will provide this information
              in JSON format or other easily readable machine format. You may
              request that we erase the personal information we hold about you
              at any time.
            </p>
          </div>

          <div>
            <div className="font-medium mb-1">Data Controller</div>
            <p>Merlin Fuchs</p>
            <p>AMN Data Solution #540919</p>
            <p>Glogauer Str. 5</p>
            <p>10999 Berlin</p>
          </div>
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
