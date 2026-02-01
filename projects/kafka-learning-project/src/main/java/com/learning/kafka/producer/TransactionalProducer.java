package com.learning.kafka.producer;

import com.learning.kafka.model.OrderEvent;
import com.learning.kafka.model.PaymentEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Transactional Kafka Producer
 * 
 * Demonstrates exactly-once semantics with Kafka transactions.
 * 
 * When to use:
 * - Sending to multiple topics atomically
 * - Read-process-write patterns (consume + produce atomically)
 * - When message loss or duplication is unacceptable
 * 
 * Requirements:
 * - transactional.id must be set
 * - acks=all (automatic with transactions)
 * - enable.idempotence=true (automatic with transactions)
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class TransactionalProducer {

    @Qualifier("transactionalKafkaTemplate")
    private final KafkaTemplate<String, Object> transactionalKafkaTemplate;

    @Value("${app.kafka.topics.orders}")
    private String ordersTopic;

    @Value("${app.kafka.topics.payments}")
    private String paymentsTopic;

    @Value("${app.kafka.topics.inventory}")
    private String inventoryTopic;

    /**
     * Send order and payment atomically
     * 
     * Either both messages are written, or neither is.
     * Creates an order and initiates payment in one atomic operation.
     */
    public void processOrderTransactionally(OrderEvent order) {
        log.info("Starting transaction for order: {}", order.orderId());

        transactionalKafkaTemplate.executeInTransaction(operations -> {
            log.info("Within transaction - sending order: {}", order.orderId());

            // Send order event
            operations.send(ordersTopic, order.userId(), order);

            // Create and send payment event
            PaymentEvent payment = PaymentEvent.forOrder(order);
            operations.send(paymentsTopic, order.userId(), payment);

            // Optionally send inventory reservation
            operations.send(inventoryTopic, order.orderId(),
                    new InventoryReservation(order.orderId(), "RESERVED"));

            log.info("Transaction completed - order: {}, payment: {}",
                    order.orderId(), payment.paymentId());

            return true;
        });
    }

    /**
     * Transaction with rollback on failure
     */
    public void processWithRollback(OrderEvent order, boolean shouldFail) {
        log.info("Processing order with potential rollback: {}", order.orderId());

        try {
            transactionalKafkaTemplate.executeInTransaction(operations -> {
                operations.send(ordersTopic, order.userId(), order);

                if (shouldFail) {
                    throw new RuntimeException("Simulated failure - transaction will rollback");
                }

                PaymentEvent payment = PaymentEvent.forOrder(order);
                operations.send(paymentsTopic, order.userId(), payment);

                return true;
            });
        } catch (Exception e) {
            log.error("Transaction aborted for order {}: {}", order.orderId(), e.getMessage());
            throw e;
        }
    }

    /**
     * Using Spring's @Transactional annotation
     * Requires proper TransactionManager configuration
     */
    @Transactional("kafkaTransactionManager")
    public void processWithSpringTransaction(OrderEvent order) {
        log.info("Processing with Spring @Transactional: {}", order.orderId());

        transactionalKafkaTemplate.send(ordersTopic, order.userId(), order);

        PaymentEvent payment = PaymentEvent.forOrder(order);
        transactionalKafkaTemplate.send(paymentsTopic, order.userId(), payment);
    }

    // Simple record for inventory reservation
    record InventoryReservation(String orderId, String status) {
    }
}
