import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export default function WebhookFields() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Webhook Options</CardTitle>
        <CardDescription>
          Set the webhook URL where you want to send the message to and other
          info.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="space-y-1">
            <Label>Webhook URL</Label>
            <Input type="url" />
          </div>
          <div className="flex space-x-3">
            <div className="space-y-1 w-full">
              <Label>Thread ID</Label>
              <Input type="url" />
            </div>
            <div className="space-y-1 w-full">
              <Label>Message ID</Label>
              <Input type="url" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button>Send Message</Button>
      </CardFooter>
    </Card>
  );
}
