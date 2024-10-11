import {Story} from "./story";
import OpenAI from 'openai';

// Initialize the OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Make sure to set this environment variable
});

async function summarizeContent(content: string, url:string): Promise<string> {
    try {
        /*
        const response1 = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that checks if content is suitable for listening as an article."
                },
                {
                    role: "user",
                    content: `The following content is parsed from a URL. Respond "YES" if it appears to be an article or news. Respond "NO" if it seems to be another type of content. :\n\n${content}`
                }
            ],
            max_tokens: 100,
            temperature: 0.5
        });
        console.log(`Is it article (${url}) :` + response1.choices[0].message.content);
        if (response1.choices[0].message.content === "NO") {
            return "fail";
        }  */

        const response2 = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {role: "system", content: "You are a helpful assistant that summarizes text."},
                {
                    role: "user",
                    content: `The following is a technical article. The audience is software developers and it will be part of a podcast. Introduce the article and what it is about. Then give more details. Talk about the article up to 25 sentences. Use a clean and understandable casual language. Explain the article like you are explaining to a friend. :\n\n${content}`
                }
            ],
            // max_tokens: 100,
            max_tokens: 750,
            temperature: 0.5
        });

        return response2.choices[0].message.content || "fail";
    } catch (error) {
        console.error("Error in OpenAI API call:", error);
        throw new Error("Failed to generate summary using OpenAI");
    }
}

export async function summarizeStory(story: Story): Promise<Story> {
    if (story.content) {
        try {
            const summary = await summarizeContent(story.content, story.url);
            if (summary !== "fail" && story.content.length > 100) {
                story.summary = summary;
            }
        } catch (error) {
            console.error(`Error summarizing content from ${story.title}:`, error);
        }
    } else {
        console.error(`No content available ${story.id}`);
    }
    return story;
}
