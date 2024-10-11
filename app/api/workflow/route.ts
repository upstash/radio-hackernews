import { serve } from "@upstash/qstash/nextjs"
import { saveStories } from "@/app/api/workflow/saveStories";
import { loadStories } from "@/app/api/workflow/loadStories";
import { summarizeStory } from "@/app/api/workflow/summarizeStory";
import { parseStory } from "@/app/api/workflow/parseStory";
import {getVoiceFile, upload} from "@/app/api/workflow/prepareAudio";

export const POST = serve(
    async (context) => {

        let stories = await context.run("load-stories", async () => {
            return await loadStories();
        });

        if(stories.length === 0) {
            console.log("No stories to process");
            return;
        }

        stories = await Promise.all(
            stories.map(story =>
                context.run("parse-story", async () => {
                    return await parseStory(story);
                })
            ));


        stories = await Promise.all(
            stories.map(story =>
                context.run("summarize-story", async () => {
                    return await summarizeStory(story);
                })
            ));


        for (const story of stories) {
            if (story.summary) {
                const {summaryAudioFile, voiceId} = await getVoiceFile(context, story.summary as string);
                const { fileUrl, duration } = await context.run("upload-audio", async () => {
                    return await upload(summaryAudioFile, `${story.id}_${Date.now()}_summary.mp3`);
                });

                story.voiceId = voiceId;
                story.summaryAudio = fileUrl;
                story.summaryAudioDuration = duration;
            }
        }

        console.log("stories transcribed and uploaded");

        await context.run("save-stories", async () => {
            await saveStories(stories);
            console.log("stories saved");
            return "success"
        });
    }
)