package com.learning.kafka.producer;

import com.learning.kafka.model.OrderEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Basic Kafka Producer
 * 
 * Demonstrates:
 * - Asynchronous message sending
 * - Callback handling
 * - Key-based partitioning
 * 
 * Note: Idempotence is enabled by default in Kafka 3.0+
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class BasicProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.orders}")
    private String ordersTopic;

    /**
     * Send order event asynchronously
     * Uses userId as key for partition affinity
     */
    public CompletableFuture<SendResult<String, Object>> sendOrder(OrderEvent order) {
        log.info("Sending order: {} to topic: {}", order.orderId(), ordersTopic);

        // Key determines partition: all orders for same user go to same partition
        return kafkaTemplate.send(ordersTopic, order.userId(), order)
                .whenComplete((result, ex) -> {
                    if (ex == null) {
                        log.info("Order {} sent successfully to partition {} with offset {}",
                                order.orderId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    } else {
                        log.error("Failed to send order {}: {}", order.orderId(), ex.getMessage());
                    }
                });
    }

    /**
     * Send order synchronously (blocking)
     */
    public SendResult<String, Object> sendOrderSync(OrderEvent order) {
        log.info("Sending order synchronously: {}", order.orderId());

        try {
            return kafkaTemplate.send(ordersTopic, order.userId(), order).get();
        } catch (Exception e) {
            log.error("Failed to send order synchronously: {}", e.getMessage());
            throw new RuntimeException("Failed to send order", e);
        }
    }

    /**
     * Send with custom partition (not recommended in most cases)
     */
    public CompletableFuture<SendResult<String, Object>> sendToPartition(
            OrderEvent order, int partition) {
        log.info("Sending order {} to specific partition {}", order.orderId(), partition);

        return kafkaTemplate.send(ordersTopic, partition, order.userId(), order)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to send to partition {}: {}", partition, ex.getMessage());
                    }
                });
    }
}
