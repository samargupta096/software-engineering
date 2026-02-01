package com.learning.kafka.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Order Event Model
 * 
 * Represents an order event in the system.
 * Uses record for immutability (Java 16+).
 */
public record OrderEvent(
        String orderId,
        String userId,
        BigDecimal amount,
        OrderStatus status,
        Instant createdAt) {
    public enum OrderStatus {
        PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    }

    /**
     * Factory method for creating new orders
     */
    public static OrderEvent create(String userId, BigDecimal amount) {
        return new OrderEvent(
                "ORD-" + UUID.randomUUID().toString().substring(0, 8),
                userId,
                amount,
                OrderStatus.PENDING,
                Instant.now());
    }

    /**
     * Create a new event with updated status
     */
    public OrderEvent withStatus(OrderStatus newStatus) {
        return new OrderEvent(orderId, userId, amount, newStatus, createdAt);
    }
}
