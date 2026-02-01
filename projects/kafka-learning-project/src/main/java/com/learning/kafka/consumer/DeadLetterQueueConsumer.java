package com.learning.kafka.consumer;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.DltHandler;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.annotation.RetryableTopic;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.retry.annotation.Backoff;
import org.springframework.stereotype.Service;

/**
 * Dead Letter Queue Consumer
 * 
 * Demonstrates error handling patterns:
 * - Automatic retries with exponential backoff
 * - Dead Letter Topic (DLT) for failed messages
 * - Manual error handling
 */
@Service
@Slf4j
public class DeadLetterQueueConsumer {

    /**
     * Consumer with automatic retry and DLQ
     * 
     * Spring Kafka will:
     * 1. Retry 3 times with exponential backoff
     * 2. Move to DLT (topic-name-dlt) if all retries fail
     */
    @RetryableTopic(attempts = "4", // 1 initial + 3 retries
            backoff = @Backoff(delay = 1000, multiplier = 2), // 1s, 2s, 4s
            dltTopicSuffix = "-dlt", autoCreateTopics = "true")
    @KafkaListener(topics = "risky-orders", groupId = "risky-order-consumers")
    public void consumeWithRetry(ConsumerRecord<String, Object> record) {
        log.info("Processing risky order: {}", record.value());

        // Simulate random failures
        if (Math.random() < 0.5) {
            log.warn("Processing failed, will retry...");
            throw new RuntimeException("Simulated processing failure");
        }

        log.info("Risky order processed successfully: {}", record.key());
    }

    /**
     * DLT Handler - processes failed messages
     */
    @DltHandler
    public void handleDlt(ConsumerRecord<String, Object> record) {
        log.error("Message failed all retries, moved to DLT: key={}, value={}",
                record.key(), record.value());

        // In production:
        // - Store in database for manual review
        // - Send alert to operations team
        // - Create support ticket

        log.info("DLT message stored for manual review: {}", record.key());
    }

    /**
     * Manual DLQ handling pattern
     */
    @KafkaListener(topics = "${app.kafka.topics.dead-letter}", groupId = "dlt-processors")
    public void processDltMessages(ConsumerRecord<String, Object> record,
            Acknowledgment acknowledgment) {
        log.info("Processing DLT message: partition={}, offset={}, key={}",
                record.partition(),
                record.offset(),
                record.key());

        try {
            // Attempt to reprocess or store for manual intervention
            handleFailedMessage(record);
            acknowledgment.acknowledge();

        } catch (Exception e) {
            log.error("Failed to process DLT message: {}", e.getMessage());
            // Consider moving to another "dead-dead-letter" topic
            // or persisting to database
        }
    }

    private void handleFailedMessage(ConsumerRecord<String, Object> record) {
        log.info("Handling failed message: {}", record.value());
        // Store in DB, send notification, etc.
    }
}
