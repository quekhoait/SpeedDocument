import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log("Redis connected successfully.");
    } catch (err) {
      console.error("Failed to connect Redis:", err);
    }
  }
})();

export default redisClient; 