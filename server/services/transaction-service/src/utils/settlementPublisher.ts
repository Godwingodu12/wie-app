import amqp from 'amqplib';

const QUEUE_NAME = 'wie.settlement.jobs';

export const publishSettlementJobs = async (
  jobs: Array<{
    settlementId: string;
    bookingId:    string;
    groupId:      string;
    hostAmount:   number;
  }>
): Promise<void> => {
  let conn: any, ch: any;
  try {
    conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    ch   = await conn.createChannel();
    await ch.assertQueue(QUEUE_NAME, { durable: true });

    for (const job of jobs) {
      ch.sendToQueue(
        QUEUE_NAME,
        Buffer.from(JSON.stringify(job)),
        { persistent: true }
      );
    }
    console.log(`📤 Published ${jobs.length} settlement jobs`);
  } finally {
    if (ch)   await ch.close();
    if (conn) await conn.close();
  }
};