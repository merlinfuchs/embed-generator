import { useMutation } from "react-query";
import {
  GenerateMagicMessageRequestWire,
  GenerateMagicMessageResponseWire,
} from "./wire";

export function useGenerateMagicMessageMutation() {
  return useMutation((req: GenerateMagicMessageRequestWire) => {
    return fetch(`/api/magic/message`, {
      method: "POST",
      body: JSON.stringify(req),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (res) => {
      if (res.ok) {
        return (await res.json()) as GenerateMagicMessageResponseWire;
      } else {
        throw new Error("Failed to generate magic message");
      }
    });
  });
}
