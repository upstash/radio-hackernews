import {serve} from "@upstash/qstash/nextjs"
import {saveStories} from "@/app/api/workflow/saveStories";
import {loadStories} from "@/app/api/workflow/loadStories";
import {summarizeStory} from "@/app/api/workflow/summarizeStory";
import {transcribeStory} from "@/app/api/workflow/transcribeStory";
import {parseStory} from "@/app/api/workflow/parseStory";

export const POST = serve(
    async (context) => {
        await context.run("initial-step", () => {
            console.log("initial step ran")
        });

        let stories = await context.run("load-stories", async () => {
            return await loadStories();
        });

        stories = await Promise.all(
            stories.map(story =>
                context.run("parse-story", async () => {
                    return await parseStory(story);
                })
            ));

        console.log("stories parsed");

        stories = await Promise.all(
            stories.map(story =>
                context.run("summarize-story", async () => {
                    return await summarizeStory(story);
                })
            ));

        console.log("stories summarized");

        await Promise.all(
            stories.map(story =>
                context.run("transcribe-story", async () => {
                    return await transcribeStory(story);
                })
            ));

        console.log("stories summarized");
        console.log(stories);

        await context.run("save-stories", async () => {
            await saveStories(stories);
            console.log("stories saved");
            return "success"
        });

    }
)
