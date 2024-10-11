import { Redis } from '@upstash/redis'
import { Story } from "@/app/api/workflow/story";

const redis = Redis.fromEnv()

export async function saveStories(stories: Story[]): Promise<void> {
    const currentTime = new Date().getTime();
    const pipeline = redis.pipeline();

    for (const story of stories) {
        pipeline.zadd(
            "stories",
            { score: currentTime, member: story}
        );
        pipeline.sadd("ids", story.id);
    }

    await pipeline.exec();
}

// Usage example
async function main() {
    const stories: Story[] = [
        // ... your story objects here
    ];

    try {
        await saveStories(stories);
        console.log("Stories saved successfully");
    } catch (error) {
        console.error("Failed to save stories:", error);
    }
}

// Uncomment the next line to run the example
// main();