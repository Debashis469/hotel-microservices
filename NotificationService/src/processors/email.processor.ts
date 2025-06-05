import { Job, Worker } from "bullmq";
import { NotificationDto } from "../dto/notification.dto";
import { MAILER_QUEUE } from "../queues/mailer.queue";
import { getRedisConnObject } from "../config/redis.config";
import { MAILER_PAYLOAD } from "../producers/email.producer";

export const setupMailerWorker = () => {
  const emailProcessor = new Worker<NotificationDto>(
    MAILER_QUEUE,
    async (job: Job) => {
      if (job.name !== MAILER_PAYLOAD) {
        throw new Error(`Invalid job name`);
      }

      const payload = job.data;
      console.log(`Processing email job: ${JSON.stringify(payload)}`);
    }, // This is where you would implement the email sending logic
    {
      connection: getRedisConnObject(),
    }
  );

  emailProcessor.on("completed", () => {
    console.log(`Email job completed successfully`);
  });

  emailProcessor.on("failed", () => {
    console.error(`Email job failed`);
  });
};
