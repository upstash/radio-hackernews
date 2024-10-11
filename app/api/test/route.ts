import {serve} from "@upstash/qstash/nextjs"
import fs from "fs";
import path from "path";

const ELEVENLABS_API_KEY = "sk_be4e7bb26635829d3f33720b79e6f9797a6a1ee58ab0d63f";
const ELEVENLABS_VOICE_ID = 'onwK4e9ZLuTAKqWW03F9'; // Replace with your preferred voice ID


export const POST = serve(
    async (context) => {

        const voiceFile : any = await context.call(
            "transcribe-summary", // Step name
            `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, // Endpoint URL
            "POST", // HTTP method
            { // Request body
                text: "this is a test",
                model_id: 'eleven_multilingual_v2',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            },
            {
                'Accept': 'audio/mpeg',
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
            }
        );

        await context.run("save-audio", async () => {
            const fileName = `summary.mp3`;
            const filePath = path.join(__dirname, 'audio', fileName);

            // Ensure the audio directory exists
            fs.mkdirSync(path.join(__dirname, 'audio'), { recursive: true });

            fs.writeFileSync(filePath, voiceFile);
            console.log(`Audio file saved: ${filePath}`);
        })

    }
)
