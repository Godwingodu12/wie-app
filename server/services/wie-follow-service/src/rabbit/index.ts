import { connectRabbitMQ } from './connection';
export const initRabbit = async () => {
  await connectRabbitMQ();
};
