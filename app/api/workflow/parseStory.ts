import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { Story } from "./story";

function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

async function parseContent(url: string): Promise<string> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();

        // Create a DOM from the HTML
        const dom = new JSDOM(html, { url });

        // Use Readability to extract the main content
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article || !article.textContent) {
            throw new Error('Failed to parse article content');
        }

        // Clean up the text (remove extra whitespace)
        return article.textContent.replace(/\s+/g, ' ').trim();
}

export async function parseStory(story: Story): Promise<Story> {
    if (story.url) {
        try {
            story.content = await parseContent(story.url);
        } catch (error) {
            console.error(`Error parsing story from ${story.url}:`, error);
        }
    }
    story.readableTime = formatTime(story.time);
    return story;
}
