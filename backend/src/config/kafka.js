import { Kafka } from 'kafkajs';
import { logger } from './logger.js';

class KafkaClient {
  constructor() {
    this.kafka = null;
    this.producer = null;
    this.consumer = null;
    this.admin = null;
    this.consumers = new Map(); // Track multiple consumers
  }

  async initialize() {
    try {
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'rail-prism-backend',
        brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
        retry: {
          initialRetryTime: 100,
          retries: 8
        }
      });

      this.producer = this.kafka.producer();
      this.consumer = this.kafka.consumer({ 
        groupId: process.env.KAFKA_GROUP_ID || 'rail-prism-group' 
      });
      this.admin = this.kafka.admin();

      await this.producer.connect();
      await this.consumer.connect();
      
      logger.info('Kafka client initialized successfully');
      
      // Create topics if they don't exist
      await this.createTopics();
      
    } catch (error) {
      logger.error('Kafka initialization error:', error);
      throw error;
    }
  }

  async createTopics() {
    try {
      const topics = [
        {
          topic: process.env.KAFKA_TRAIN_POSITIONS_TOPIC || 'train-positions',
          numPartitions: 3,
          replicationFactor: 1
        },
        {
          topic: process.env.KAFKA_TRAIN_EVENTS_TOPIC || 'train-events',
          numPartitions: 3,
          replicationFactor: 1
        },
        {
          topic: process.env.KAFKA_OPTIMIZATION_RESULTS_TOPIC || 'optimization-results',
          numPartitions: 3,
          replicationFactor: 1
        }
      ];

      await this.admin.createTopics({
        topics: topics,
        waitForLeaders: true
      });

      logger.info('Kafka topics created successfully');
    } catch (error) {
      logger.error('Error creating Kafka topics:', error);
    }
  }

  async publishMessage(topic, message, key = null) {
    try {
      const result = await this.producer.send({
        topic,
        messages: [{
          key: key || Date.now().toString(),
          value: JSON.stringify(message),
          timestamp: Date.now().toString()
        }]
      });

      logger.debug(`Message published to topic ${topic}:`, message);
      return result;
    } catch (error) {
      logger.error(`Error publishing message to topic ${topic}:`, error);
      throw error;
    }
  }

  async subscribeToTopic(topic, callback) {
    try {
      // Create a unique consumer for each topic
      const consumerId = `${topic}-consumer`;
      
      if (this.consumers.has(consumerId)) {
        logger.warn(`Consumer for topic ${topic} already exists`);
        return;
      }

      const consumer = this.kafka.consumer({ 
        groupId: `${process.env.KAFKA_GROUP_ID || 'rail-prism-group'}-${topic}` 
      });
      
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });
      
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const messageValue = JSON.parse(message.value.toString());
            await callback(messageValue, topic, partition);
          } catch (error) {
            logger.error(`Error processing message from topic ${topic}:`, error);
          }
        },
      });

      // Store the consumer for cleanup
      this.consumers.set(consumerId, consumer);
      logger.info(`Subscribed to topic: ${topic}`);
    } catch (error) {
      logger.error(`Error subscribing to topic ${topic}:`, error);
      throw error;
    }
  }

  async disconnect() {
    try {
      // Disconnect all topic consumers
      for (const [consumerId, consumer] of this.consumers) {
        try {
          await consumer.disconnect();
          logger.info(`Disconnected consumer: ${consumerId}`);
        } catch (error) {
          logger.error(`Error disconnecting consumer ${consumerId}:`, error);
        }
      }
      this.consumers.clear();

      // Disconnect main clients
      if (this.producer) await this.producer.disconnect();
      if (this.consumer) await this.consumer.disconnect();
      if (this.admin) await this.admin.disconnect();
      logger.info('Kafka client disconnected');
    } catch (error) {
      logger.error('Error disconnecting Kafka client:', error);
    }
  }
}

export const kafkaClient = new KafkaClient();