package com.learning.kafka.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Payment Event Model
 */
public record PaymentEvent(
        String paymentId,
        String orderId,
        String userId,
        BigDecimal amount,
        PaymentStatus status,
        Instant processedAt) {
    public enum PaymentStatus {
        INITIATED, PROCESSING, COMPLETED, FAILED, REFUNDED
    }

    public static PaymentEvent forOrder(OrderEvent order) {
        return new PaymentEvent(
                "PAY-" + UUID.randomUUID().toString().substring(0, 8),
                order.orderId(),
                order.userId(),
                order.amount(),
                PaymentStatus.INITIATED,
                Instant.now());
    }

    public PaymentEvent withStatus(PaymentStatus newStatus) {
        return new PaymentEvent(paymentId, orderId, userId, amount, newStatus, processedAt);
    }
}
