import "dotenv/config";
import OpenAI from "openai";

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;

const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const apiKey = process.env.FREELLMAPI_API_KEY;
const baseURL =
    process.env.LLM_BASE_URL || "http://localhost:3001/v1";
const model =
    process.env.LLM_MODEL || "gemini-3-flash-preview";

if (!apiKey) {
    throw new Error("FREELLMAPI_API_KEY is missing");
}

const client = new OpenAI({
    apiKey,
    baseURL
});

export const askLLM = async (
    systemPrompt: string,
    userPrompt: string
) => {
    console.log("LLM 1. Request started");
    console.log("LLM 2. FreeLLMAPI key loaded:", Boolean(apiKey));
    console.log("LLM 3. Using model:", model);
    console.log("LLM 4. Using base URL:", baseURL);

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            console.log(
                `LLM 5. Sending request (${attempt}/${MAX_RETRIES})`
            );

            const response =
                await client.chat.completions.create({
                    model,

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: userPrompt
                        }
                    ],

                    temperature: 0
                });

            console.log(
                "LLM 6. FreeLLMAPI response received"
            );

            const text =
                response.choices[0]?.message?.content;

            if (!text) {
                throw new Error(
                    "LLM returned an empty response"
                );
            }

            console.log(
                "LLM 7. LLM response:"
            );
            console.log(text);

            return text;

        } catch (error: any) {
            console.error(
                `LLM request failed on attempt ${attempt}:`,
                error?.message || error
            );

            const status = error?.status;

            const temporaryError =
                status === 429 ||
                status === 500 ||
                status === 502 ||
                status === 503 ||
                status === 504;

            if (
                temporaryError &&
                attempt < MAX_RETRIES
            ) {
                const delay =
                    RETRY_DELAY * attempt;

                console.log(
                    `LLM 8. Retrying in ${delay}ms...`
                );

                await wait(delay);
                continue;
            }

            break;
        }
    }

    throw new Error(
        "LLM request failed after all retries"
    );
};