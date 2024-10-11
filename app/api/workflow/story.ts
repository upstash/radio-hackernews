

export interface Story {
    id: number;
    title: string;
    url?: string;
    text?: string;
    score: number;
    by: string;
    type: string;
    time: number;
    readableTime: string;
    content?: string;
    summary?: string;
    voiceId?: string;
    summaryAudio?: string;
    summaryAudioDuration?: number;
    contentAudio?: string;
}
