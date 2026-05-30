import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY!,
      baseURL: "https://api.deepseek.com",
    });
  }
  return client;
}

export async function transformWithDeepSeek(
  instruction: string,
  context: string
): Promise<string> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is required for AI transform steps");
  }

  const response = await getClient().chat.completions.create({
    model: "deepseek-v4-flash",
    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content:
          "You transform pipeline data. Return only the final text output with no markdown or preamble.",
      },
      {
        role: "user",
        content: `${instruction}\n\nContext:\n${context}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}
