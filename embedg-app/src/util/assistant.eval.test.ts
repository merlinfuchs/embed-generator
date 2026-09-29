import { describe, expect, it } from "vitest";
import type {
  AssistantChatMessageWire,
  AssistantChatRequestWire,
  AssistantChatResponseDataWire,
} from "../api/wire";
import { defaultMessage } from "../discord/defaultMessage";
import type { Message } from "../discord/schema";
import { runAssistantPrompt, serializeMessage } from "./assistant";
import {
  type EvalCase,
  type EvalRoute,
  evalCases,
  evalGuild,
  premiumFeatures,
} from "./assistant.eval.cases";

// Runs the prompts of assistant.eval.cases.ts against the AI assistant and
// writes a report. Start the eval server first, then run with its URL:
//
//   OPENROUTER_API_KEY=... go run ./assistant/evalserver
//   ASSISTANT_EVAL_URL=http://localhost:4456 pnpm exec vitest run assistant.eval
//
// ASSISTANT_EVAL_FILTER only runs the cases whose name contains one of its
// comma separated parts.
// Vitest puts the environment on import.meta.env.
const env = import.meta.env as Record<string, string | undefined>;
const url = env.ASSISTANT_EVAL_URL;
const filter = env.ASSISTANT_EVAL_FILTER ?? "";
const outDir = env.ASSISTANT_EVAL_OUT ?? "eval-results";
// Like the server's default max_repairs, which the eval server doesn't know.
const maxRepairs = 2;

// USD per million input, cached input and output tokens.
const prices: Record<string, [number, number, number]> = {
  "gpt-5-mini": [0.25, 0.025, 2],
  "gpt-5-nano": [0.05, 0.005, 0.4],
};

interface EvalInfo {
  model: string;
  tokens: {
    InputTokens: number;
    CachedInputTokens: number;
    OutputTokens: number;
  };
  ms: number;
}

interface CaseResult {
  name: string;
  route: EvalRoute[];
  // The labels of the fields the assistant asked the user to fill in.
  fields: string[];
  // For questions that are then built: the answer to the question.
  answer?: string;
  buildPrompt?: string;
  message?: string;
  edited: boolean;
  repairs: number;
  issues: string[];
  // What the case's check found wrong with the message.
  problems: string[];
  // IDs and links in the message that weren't in the prompt, the message or
  // the guild before.
  invented: string[];
  buildOk: boolean;
  cost: number;
  ms: number;
  error?: string;
  result?: string;
}

function cost(info: EvalInfo) {
  const [input, cached, output] = prices[info.model] ?? [0, 0, 0];
  const t = info.tokens;
  return (
    ((t.InputTokens - t.CachedInputTokens) * input +
      t.CachedInputTokens * cached +
      t.OutputTokens * output) /
    1_000_000
  );
}

async function runCase(c: EvalCase): Promise<CaseResult> {
  const result: CaseResult = {
    name: c.name,
    route: c.route,
    edited: false,
    repairs: 0,
    issues: [],
    problems: [],
    invented: [],
    fields: [],
    buildOk: false,
    cost: 0,
    ms: 0,
  };
  const features = c.features ?? premiumFeatures;
  let message: Message = structuredClone(c.message ?? defaultMessage);
  const known = c.prompt + JSON.stringify(message) + JSON.stringify(evalGuild);

  const start = Date.now();
  const prompt = async (messages: AssistantChatMessageWire[]) => {
    let rounds = 0;
    const res = await runAssistantPrompt({
      messages,
      features,
      getMessage: () => structuredClone(message),
      applyMessage: (applied) => {
        message = applied;
        result.edited = true;
      },
      send: async (req: AssistantChatRequestWire) => {
        if (rounds++ > maxRepairs) {
          return {
            success: false,
            data: null as never,
            error: { status: 400, code: "repair_limit", message: "" },
          };
        }
        // The server loads the guild, the eval server takes it.
        const res = await fetch(`${url}/chat`, {
          method: "POST",
          body: JSON.stringify({
            ...req,
            guild: { ...evalGuild, features },
          }),
        }).then(
          (r) =>
            r.json() as Promise<
              | {
                  success: true;
                  data: AssistantChatResponseDataWire & { eval: EvalInfo };
                }
              | {
                  success: false;
                  data: never;
                  error: { status: number; code: string; message: string };
                }
            >,
        );
        if (res.success) result.cost += cost(res.data.eval);
        return res;
      },
    });
    result.repairs += res.repairs;
    return res;
  };

  try {
    const messages: AssistantChatMessageWire[] = [
      { role: "user", content: c.prompt },
    ];
    let res = await prompt(messages);
    result.buildPrompt = res.buildPrompt;
    result.fields = res.fields.map((f) => `${f.label} (${f.type})`);

    // Like clicking "Build this", if the question was answered first.
    if (c.thenBuild && !result.edited && res.buildPrompt) {
      result.answer = res.message;
      res = await prompt([
        ...messages,
        { role: "assistant", content: res.message },
        { role: "user", content: res.buildPrompt },
      ]);
    }
    result.message = res.message;
    result.issues = res.issues;
  } catch (err) {
    result.error = (err as Error).message;
  }
  result.ms = Date.now() - start;

  const json = JSON.stringify(message);
  result.invented = [
    ...(json.match(/\b\d{17,20}\b/g) ?? []),
    ...(json.match(/https?:\/\/[^\s"')\]]+/g) ?? []),
  ].filter((v) => !known.includes(v));
  // Only what was built is checked, as asking first can be fine too.
  if (result.edited) result.problems = c.check?.(message) ?? [];

  const shouldEdit = c.route.includes("build") || !!c.thenBuild;
  const mayEdit = shouldEdit || c.route.includes("clarify");
  // When the assistant can only ask, it should ask with fields.
  const mustAsk = c.route.length === 1 && c.route[0] === "clarify";
  result.buildOk =
    !result.error &&
    result.issues.length === 0 &&
    result.problems.length === 0 &&
    result.invented.length === 0 &&
    (result.edited ? mayEdit : !shouldEdit || c.route.length > 1) &&
    (!mustAsk || result.fields.length > 0) &&
    // Questions are answered before anything is built.
    (!c.thenBuild || !!result.answer);
  result.result = JSON.stringify(
    JSON.parse(serializeMessage(message)),
    null,
    1,
  );
  return result;
}

function report(results: CaseResult[]) {
  const sum = (f: (r: CaseResult) => number) =>
    results.reduce((a, r) => a + f(r), 0);
  const lines = [
    `# AI assistant eval, ${new Date().toISOString()}`,
    "",
    `Ok: ${sum((r) => +r.buildOk)}/${results.length}. ` +
      `Asked with fields: ${sum((r) => +(r.fields.length > 0))}. ` +
      `Repairs: ${sum((r) => r.repairs)}. ` +
      `Cost: $${sum((r) => r.cost).toFixed(4)}, ` +
      `avg $${(sum((r) => r.cost) / results.length).toFixed(4)} and ` +
      `${(sum((r) => r.ms) / results.length / 1000).toFixed(1)}s per case.`,
    "",
    "| Case | Expected | Fields | Result | Repairs | Cost | Time |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...results.map(
      (r) =>
        `| ${r.name} | ${r.route.join("/")} | ${r.fields.length || "-"} | ${
          r.buildOk ? "ok" : "✗"
        }${r.edited ? " (edited)" : ""} | ${r.repairs} | $${r.cost.toFixed(
          4,
        )} | ${(r.ms / 1000).toFixed(1)}s |`,
    ),
    "",
    ...results.flatMap((r) => [
      `## ${r.name}`,
      "",
      r.fields.length ? `Fields: ${r.fields.join(", ")}` : "",
      r.answer ? `> ${r.answer.replace(/\n/g, "\n> ")}` : "",
      r.buildPrompt ? `Build this: ${r.buildPrompt}` : "",
      r.message ? `> ${r.message.replace(/\n/g, "\n> ")}` : "",
      r.error ? `Error: ${r.error}` : "",
      r.problems.length ? `Problems: ${r.problems.join(", ")}` : "",
      r.invented.length ? `Invented: ${r.invented.join(", ")}` : "",
      ...r.issues.map((i) => `- ${i}`),
      "",
      "```json",
      r.result ?? "",
      "```",
      "",
    ]),
  ];
  return lines.filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
}

describe.skipIf(!url)("AI assistant eval", () => {
  it(
    "runs the cases",
    async () => {
      const cases = evalCases.filter((c) =>
        filter.split(",").some((f) => c.name.includes(f)),
      );
      const results: CaseResult[] = [];
      // A few at a time, to stay within rate limits.
      for (let i = 0; i < cases.length; i += 6) {
        results.push(
          ...(await Promise.all(cases.slice(i, i + 6).map(runCase))),
        );
      }

      // The app has no Node types, and this only runs in Vitest.
      const fs: {
        mkdirSync(path: string, options: { recursive: boolean }): void;
        writeFileSync(path: string, data: string): void;
      } = await import(/* @vite-ignore */ `node:${"fs"}`);
      fs.mkdirSync(outDir, { recursive: true });
      const file = `${outDir}/assistant-${Date.now()}.md`;
      const text = report(results);
      fs.writeFileSync(file, text);
      console.log(text.split("\n").slice(0, 3).join("\n"));
      console.log(`Report: ${file}`);
      expect(results).toHaveLength(cases.length);
    },
    60 * 60 * 1000,
  );
});
