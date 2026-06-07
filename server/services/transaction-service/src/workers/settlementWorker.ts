import amqp from 'amqplib';
import { SettlementService } from '../services/settlementService';

const QUEUE_NAME    = 'wie.settlement.jobs';
const RATE_LIMIT_MS = 500; // 120/min — safe Razorpay rate

export const startSettlementWorker = async (): Promise<void> => {
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqps://yrdwbvfm:p53hm_GrZl7S3EMJ8q0y_git9g3diZJV@whale.rmq.cloudamqp.com/yrdwbvfm';
  let conn: any, ch: any;

  const connect = async () => {
    try {
      conn = await amqp.connect(RABBITMQ_URL);
      ch   = await conn.createChannel();
      await ch.assertQueue(QUEUE_NAME, { durable: true });
      ch.prefetch(1); // One at a time per worker

      ch.consume(QUEUE_NAME, async (msg: any) => {
        if (!msg) return;

        const job = JSON.parse(msg.content.toString());
        try {
          // Step 1: Validate + lock
          const { success, reason } = await SettlementService.processSettlementJob(
            job.settlementId
          );

          if (!success) {
            ch.ack(msg);
            return;
          }

          // Step 2: Execute transfer
          await SettlementService.executeHostTransfer(job.settlementId);

          ch.ack(msg);
          await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));

        } catch (err: any) {
          console.error(`❌ [SettlementWorker] Failed: ${job.settlementId}`, err.message);
          ch.nack(msg, false, false); // Dead-letter after max retries
        }
      });

      conn.on('error', () => {
        console.error('⚠️ [SettlementWorker] Connection lost — reconnecting in 5s');
        setTimeout(connect, 5000);
      });

    } catch (err: any) {
      console.error('❌ [SettlementWorker] Startup failed:', err.message);
      setTimeout(connect, 5000);
    }
  };

  await connect();
};