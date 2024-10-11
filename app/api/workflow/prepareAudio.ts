import {ObjectCannedACL, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {WorkflowContext} from "@upstash/qstash/workflow";



// Array of available voice IDs
// https://elevenlabs.io/docs/voices/default-voices
const ELEVENLABS_VOICE_IDS = [
    'cgSgspJ2msm6clMCkdW9',
    'FGY2WhTYpPnrIDTdsKH5',
    'TX3LPaxmHKxFdv7VOQHJ',
    'bIHbv24MWmeRgasZH58o',
    'EXAVITQu4vr4xnSDxMaL'
];

// Function to randomly select a voice ID
function getRandomVoiceId() {
    const randomIndex = Math.floor(Math.random() * ELEVENLABS_VOICE_IDS.length);
    return ELEVENLABS_VOICE_IDS[randomIndex];
}


const s3Region = process.env.AWS_REGION || 'default-region';  // Replace with your default region if needed
const s3AccessKeyId = process.env.AWS_ACCESS_KEY_ID;
const s3SecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!s3AccessKeyId || !s3SecretAccessKey) {
    throw new Error("AWS credentials are not defined");
}

const s3Client = new S3Client({
    region: s3Region,
    credentials: {
        accessKeyId: s3AccessKeyId,
        secretAccessKey: s3SecretAccessKey,
    }
});

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_BUCKET_URL = process.env.S3_BUCKET_URL; // e.g., "https://your-bucket-name.s3.amazonaws.com"

export async function getVoiceFile(context: WorkflowContext, text: string) {
    const selectedVoiceId = getRandomVoiceId();
    console.log(`Selected voice ID: ${selectedVoiceId}`);

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    if (!ELEVENLABS_API_KEY) {
        throw new Error("ELEVENLABS API Key is not defined");
    }

    const headers = {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
    };

    return {summaryAudioFile: await context.call(
        "transcribe", // Step name
        `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`, // Endpoint URL
        "POST", // HTTP method
        { // Request body
            text: text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
                stability: 0.5,
                similarity_boost: 0.5
            }
        },
        headers
    ),
        voiceId: selectedVoiceId
    };
}


async function calculateAudioDuration(audioBuffer: Buffer): Promise<number> {
    const fileSizeInBytes = audioBuffer.length;
    const bitrate = 128 * 1024; // 128 kbps in bits per second

    // Calculate duration: (file size in bits) / (bitrate in bits per second)
    const durationInSeconds = (fileSizeInBytes * 8) / bitrate;

    console.log(`Calculated audio duration: ${durationInSeconds.toFixed(2)} seconds`);
    return Number(durationInSeconds.toFixed(2));
}

export async function upload(audio: any, fileName: string) {
    const buffer = Buffer.from(audio, 'binary');
    const s3Key = `audio/${fileName}`;

    try {
        const acl: ObjectCannedACL = 'public-read';

        const uploadParams = {
            Bucket: S3_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: 'audio/mpeg',
            ACL: acl, // Make the object publicly readable
        };

        const command = new PutObjectCommand(uploadParams);
        await s3Client.send(command);
        const fileUrl = `${S3_BUCKET_URL}/${s3Key}`
        console.log(`File uploaded successfully to S3: ${fileUrl}`);

        // Calculate duration
        const duration = await calculateAudioDuration(buffer);

        // Return both the file URL and duration
        return { fileUrl, duration };

    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw error;
    }
}