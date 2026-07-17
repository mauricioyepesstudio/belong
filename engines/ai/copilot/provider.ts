import { buildCopilotSystemPrompt, buildCopilotUserPrompt } from "./prompts";
import type { CopilotRunInput, CopilotRunResult } from "./types";
import { parseCopilotResponse } from "./parse-response";
import { runDeterministicCopilot } from "./deterministic";

type ChatCompletionResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { total_tokens?: number };
};

export async function runCopilotProvider(input: CopilotRunInput): Promise<CopilotRunResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const inputSummary = {
    contextType: input.context.type,
    contextId: input.context.id,
    contextName: input.context.name,
    discussionCount: input.context.discussions.length,
    taskCount: input.context.tasks.length,
    actionType: input.actionType,
  };

  if (!apiKey) {
    const output = runDeterministicCopilot(input);
    return {
      output,
      model: "belong-deterministic",
      tokensUsed: null,
      inputSummary,
    };
  }

  const systemPrompt = buildCopilotSystemPrompt(input.actionType);
  const userPrompt = buildCopilotUserPrompt(input.context, input.actionType, input.prompt);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`AI provider error (${response.status}): ${body.slice(0, 200)}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned empty response");
  }

  const output = parseCopilotResponse(input.actionType, content);

  return {
    output,
    model,
    tokensUsed: data.usage?.total_tokens ?? null,
    inputSummary,
  };
}
