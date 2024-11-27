import fetch from 'node-fetch';
import {Story} from "./story";
import {Redis} from "@upstash/redis";

const redis = Redis.fromEnv()

function formatTime(timestamp: number): string {
    const date = new Date(timestamp * 1000); // Convert seconds to milliseconds
    return date.toLocaleString(); // This will use the system's locale settings
}

export async function loadStories(): Promise<Story[]> {
    try {
        const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let storyIds: number[] = await response.json();


        const stories = await Promise.all(
            storyIds.slice(0, 30).map(async (id) => {
                const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`);
                if (!storyResponse.ok) {
                    throw new Error(`HTTP error! status: ${storyResponse.status}`);
                }
                const storyData: Story = await storyResponse.json();
                return {
                    id: storyData.id,
                    title: storyData.title,
                    url: storyData.url,
                    text: storyData.text,
                    score: storyData.score,
                    by: storyData.by,
                    type: storyData.type,
                    time: storyData.time,
                    readableTime: formatTime(storyData.time)
                };
            })
        );
        // Sort stories by score in descending order
        let topStories = stories.sort((a, b) => b.score - a.score);

        // Remove story ids that already exist in redis set 'ids'
        const existingIds : number[] = await redis.smembers('ids');
        console.log('Existing ids:', existingIds);

        // Filter out existing ids from top stories
        topStories = topStories.filter(story => !existingIds.includes(story.id) && story.url);

        // return top 3
        topStories = topStories.slice(0, 3);

        console.log('Top stories:', topStories);

        return topStories;
    } catch (error) {
        console.error('Error fetching stories:', error);
        throw error;
    }
}