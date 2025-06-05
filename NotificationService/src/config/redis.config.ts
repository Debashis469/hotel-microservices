import Redis from "ioredis";
import { serverConfig } from ".";

//singleton pattern to create a Redis connection
// This will ensure that only one connection is created and reused throughout the application
function connectionToRedis() {
  try {
    let connection: Redis;

    const redisConfig = {
      port: serverConfig.REDIS_PORT,
      host: serverConfig.REDIS_HOST,
      maxRetriesPerRequest: null, // Disable automatic reconnection
    };

    return () => {
      if (!connection) {
        connection = new Redis(redisConfig);
        return connection;
      }

      return connection;
    };
  } catch (error) {
    console.error("Error connecting to Redis:", error);
    throw error;
  }
}

export const getRedisConnObject = connectionToRedis();