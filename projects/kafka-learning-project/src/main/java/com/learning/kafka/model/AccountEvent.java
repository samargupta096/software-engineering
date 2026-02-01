package com.learning.kafka.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Account Event Model for Event Sourcing
 * 
 * Represents different events that can happen to an account.
 */
public sealed interface AccountEvent permits
        AccountEvent.AccountCreated,
        AccountEvent.MoneyDeposited,
        AccountEvent.MoneyWithdrawn {

    String eventId();

    String accountId();

    Instant occurredAt();

    /**
     * Event: Account Created
     */
    record AccountCreated(
            String eventId,
            String accountId,
            String ownerName,
            Instant occurredAt) implements AccountEvent {
        public static AccountCreated create(String accountId, String ownerName) {
            return new AccountCreated(
                    UUID.randomUUID().toString(),
                    accountId,
                    ownerName,
                    Instant.now());
        }
    }

    /**
     * Event: Money Deposited
     */
    record MoneyDeposited(
            String eventId,
            String accountId,
            BigDecimal amount,
            String description,
            Instant occurredAt) implements AccountEvent {
        public static MoneyDeposited create(String accountId, BigDecimal amount, String description) {
            return new MoneyDeposited(
                    UUID.randomUUID().toString(),
                    accountId,
                    amount,
                    description,
                    Instant.now());
        }
    }

    /**
     * Event: Money Withdrawn
     */
    record MoneyWithdrawn(
            String eventId,
            String accountId,
            BigDecimal amount,
            String description,
            Instant occurredAt) implements AccountEvent {
        public static MoneyWithdrawn create(String accountId, BigDecimal amount, String description) {
            return new MoneyWithdrawn(
                    UUID.randomUUID().toString(),
                    accountId,
                    amount,
                    description,
                    Instant.now());
        }
    }
}
