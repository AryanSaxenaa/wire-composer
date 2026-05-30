import OpenAI from "openai";
import { WireAction, PipelineParseResult } from "@/types";
import { PipelineParseResultSchema } from "@/lib/pipeline-schema";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY!,
  baseURL: "https://api.deepseek.com",
});

const PIPELINE_COMPILER_SYSTEM_PROMPT = `You are a pipeline compiler. You receive a plain-English workflow description and a list of available Wire actions. Your job is to:
1. Identify the sequence of Wire actions required to implement the described workflow
2. Determine the data flow between actions (which output field of step N feeds into which input field of step N+1)
3. Return a structured JSON pipeline object matching the Pipeline schema exactly

Rules:
- Only use actions from the provided availableActions list. Never invent actions.
- Every edge must have explicit dataMapping entries connecting source output fields to target input fields.
- If the prompt is ambiguous about a critical detail (e.g. "my account" — which platform?), set clarificationNeeded: true and write a specific clarificationQuestion.
- Do not set clarificationNeeded: true for minor details — make a reasonable assumption and note it in reasoning.
- Node positions: use placeholder positions {x:0,y:0}; the server will apply vertical auto-layout.
- Set all node statuses to "idle".
- Leave credentials as empty objects — the user will fill those in.
- The name field should be a short, memorable title derived from the prompt (max 6 words).

Return ONLY valid JSON.`;

export async function parsePipelineFromNL(
  prompt: string,
  availableActions: WireAction[],
  retryCount = 0
): Promise<PipelineParseResult> {
  const response = await client.chat.completions.create({
    model: "deepseek-v4-flash",
    response_format: { type: "json_object" },
    max_tokens: 4096,
    messages: [
      { role: "system", content: PIPELINE_COMPILER_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          userPrompt: prompt,
          availableActions,
        }),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    if (retryCount < 1) return parsePipelineFromNL(prompt, availableActions, retryCount + 1);
    throw new Error("DeepSeek returned empty content");
  }

  const clean = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(clean);
  } catch {
    if (retryCount < 2) {
      return parsePipelineFromNL(
        `${prompt}\n\nPrevious response was invalid JSON. Fix and return only valid JSON.`,
        availableActions,
        retryCount + 1
      );
    }
    throw new Error("Failed to parse DeepSeek response after retries");
  }

  return PipelineParseResultSchema.parse(parsed);
}
