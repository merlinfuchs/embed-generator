import ToolsBackButton from "../../components/ToolsBackButton";
import ToolsWebhookInfo from "../../components/ToolsWebhookInfo";

export default function WebhookInfoToolInfo() {
  return (
    <div className="overflow-y-auto w-full">
      <div className="flex flex-col max-w-5xl mx-auto px-4 w-full my-5 mb-20 lg:mt-20 space-y-20">
        <ToolsBackButton />
        <div>
          <div className="mb-10">
            <h1 className="text-white font-medium mb-3 text-2xl">
              Webhook Info
            </h1>
            <h2 className="text-gray-400 font-light text-sm">
              Discord webhooks are a great way to send messages to Discord
              channels without a bot. This tool lets you easily inspect and get
              information about a webhook.
            </h2>
          </div>
          <ToolsWebhookInfo />
        </div>
      </div>
    </div>
  );
}
