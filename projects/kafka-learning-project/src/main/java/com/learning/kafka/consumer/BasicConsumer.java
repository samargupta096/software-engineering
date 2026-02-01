package com.learning.kafka.consumer;

import com.learning.kafka.model.OrderEvent;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

/**
 * Basic Kafka Consumer
 * 
 * Demonstrates:
 * - Message consumption with @KafkaListener
 * - Manual offset acknowledgment
 * - Consumer group behavior
 */
@Service
@Slf4j
public class BasicConsumer {

    /**
     * Basic consumer with manual acknowledgment
     * 
     * Each message is acknowledged individually after processing.
     * This ensures at-least-once delivery.
     */
    @KafkaListener(topics = "${app.kafka.topics.orders}", groupId = "order-consumers", containerFactory = "kafkaListenerContainerFactory")
    public void consumeOrder(ConsumerRecord<String, OrderEvent> record,
            Acknowledgment acknowledgment) {
        log.info("Received order from partition {} at offset {}: {}",
                record.partition(),
                record.offset(),
                record.value());

        try {
            // Process the order
            processOrder(record.value());

            // Acknowledge the message (commits offset)
            acknowledgment.acknowledge();
            log.debug("Order {} acknowledged", record.value().orderId());

        } catch (Exception e) {
            log.error("Failed to process order {}: {}",
                    record.value().orderId(), e.getMessage());
            // Not acknowledging = message will be redelivered
            // In production, consider DLQ pattern
            throw e;
        }
    }

    /**
     * Consumer showing partition and key information
     */
    @KafkaListener(topics = "${app.kafka.topics.payments}", groupId = "payment-consumers", containerFactory = "kafkaListenerContainerFactory")
    public void consumePayment(ConsumerRecord<String, Object> record,
            Acknowledgment acknowledgment) {
        log.info("Payment received - Key: {}, Partition: {}, Offset: {}",
                record.key(),
                record.partition(),
                record.offset());

        log.info("Payment details: {}", record.value());

        acknowledgment.acknowledge();
    }

    private void processOrder(OrderEvent order) {
        log.info("Processing order: {} for user: {} amount: ${}",
                order.orderId(),
                order.userId(),
                order.amount());

        // Simulate processing time
        try {
            Thread.sleep(100);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
