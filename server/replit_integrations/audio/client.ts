import OpenAI from "openai";
import { Readable } from "stream";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface VoiceChatResult {
  audioBase64: string;
  transcript: string;
  userTranscript?: string;
}

export async function voiceChat(
  audioBase64: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<VoiceChatResult> {
  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })),
    {
      role: "user",
      content: [
        {
          type: "input_audio",
          input_audio: {
            data: audioBase64,
            format: "wav"
          }
        }
      ]
    }
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "alloy", format: "wav" },
    messages,
    max_tokens: 500, // Limit response length for speed
    temperature: 0.7,
  });

  const choice = response.choices[0];
  const audioOutput = choice.message.audio;
  const textContent = choice.message.content || "";

  return {
    audioBase64: audioOutput?.data || "",
    transcript: audioOutput?.transcript || textContent,
    userTranscript: undefined
  };
}

export async function transcribeAudio(audioBase64: string): Promise<string> {
  const audioBuffer = Buffer.from(audioBase64, "base64");
  
  const file = new File([audioBuffer], "audio.wav", { type: "audio/wav" });
  
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "gpt-4o-mini-transcribe",
    response_format: "json"
  });

  return transcription.text;
}

export async function textToSpeech(text: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-audio",
    modalities: ["text", "audio"],
    audio: { voice: "alloy", format: "wav" },
    messages: [
      { role: "user", content: `Please say the following text naturally: "${text}"` }
    ],
  });

  const choice = response.choices[0];
  return choice.message.audio?.data || "";
}

export { openai };
