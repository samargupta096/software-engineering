package com.learning.kafka.usecases;

import com.learning.kafka.model.AccountEvent;
import com.learning.kafka.model.AccountEvent.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Event Sourcing Use Case
 * 
 * Demonstrates:
 * - Event store pattern using Kafka
 * - Replaying events to rebuild state
 * - Maintaining materialized view from events
 * 
 * Benefits:
 * - Complete audit trail
 * - Time travel (rebuild state at any point)
 * - Easy debugging
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class EventSourcingUseCase {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${app.kafka.topics.account-events}")
    private String accountEventsTopic;

    // In-memory materialized view (use Redis/DB in production)
    private final Map<String, AccountState> accountStates = new ConcurrentHashMap<>();
    private final Map<String, List<AccountEvent>> eventStore = new ConcurrentHashMap<>();

    /**
     * Create a new account
     */
    public void createAccount(String accountId, String ownerName) {
        AccountCreated event = AccountCreated.create(accountId, ownerName);
        publishEvent(accountId, event);
        log.info("Account created: {}", accountId);
    }

    /**
     * Deposit money
     */
    public void deposit(String accountId, BigDecimal amount, String description) {
        MoneyDeposited event = MoneyDeposited.create(accountId, amount, description);
        publishEvent(accountId, event);
        log.info("Deposit of {} to account {}", amount, accountId);
    }

    /**
     * Withdraw money
     */
    public void withdraw(String accountId, BigDecimal amount, String description) {
        MoneyWithdrawn event = MoneyWithdrawn.create(accountId, amount, description);
        publishEvent(accountId, event);
        log.info("Withdrawal of {} from account {}", amount, accountId);
    }

    private void publishEvent(String accountId, AccountEvent event) {
        // Key = accountId ensures all events for an account go to same partition
        // This guarantees ordering for replay!
        kafkaTemplate.send(accountEventsTopic, accountId, event);
    }

    /**
     * Event consumer - rebuilds state from events
     */
    @KafkaListener(topics = "${app.kafka.topics.account-events}", groupId = "account-state-builder", containerFactory = "kafkaListenerContainerFactory")
    public void handleAccountEvent(ConsumerRecord<String, AccountEvent> record,
            Acknowledgment acknowledgment) {
        String accountId = record.key();
        AccountEvent event = record.value();

        log.debug("Received event for account {}: {}", accountId, event.getClass().getSimpleName());

        // Store event (event store)
        eventStore.computeIfAbsent(accountId, k -> new ArrayList<>()).add(event);

        // Apply event to state (materialized view)
        AccountState currentState = accountStates.getOrDefault(accountId,
                new AccountState(accountId, "", BigDecimal.ZERO, new ArrayList<>()));

        AccountState newState = applyEvent(currentState, event);
        accountStates.put(accountId, newState);

        log.info("Account {} new balance: {}", accountId, newState.balance());

        acknowledgment.acknowledge();
    }

    /**
     * Apply event to current state - pure function
     */
    private AccountState applyEvent(AccountState state, AccountEvent event) {
        List<String> newHistory = new ArrayList<>(state.history());

        return switch (event) {
            case AccountCreated e -> new AccountState(
                    e.accountId(),
                    e.ownerName(),
                    BigDecimal.ZERO,
                    List.of("Account created"));
            case MoneyDeposited e -> {
                newHistory.add("Deposited: " + e.amount());
                yield new AccountState(
                        state.accountId(),
                        state.ownerName(),
                        state.balance().add(e.amount()),
                        newHistory);
            }
            case MoneyWithdrawn e -> {
                newHistory.add("Withdrawn: " + e.amount());
                yield new AccountState(
                        state.accountId(),
                        state.ownerName(),
                        state.balance().subtract(e.amount()),
                        newHistory);
            }
        };
    }

    /**
     * Replay all events to rebuild state (e.g., for new projection)
     */
    public AccountState replayEvents(String accountId) {
        List<AccountEvent> events = eventStore.get(accountId);
        if (events == null || events.isEmpty()) {
            return null;
        }

        AccountState state = new AccountState(accountId, "", BigDecimal.ZERO, new ArrayList<>());
        for (AccountEvent event : events) {
            state = applyEvent(state, event);
        }

        log.info("Replayed {} events for account {}, final balance: {}",
                events.size(), accountId, state.balance());

        return state;
    }

    /**
     * Get current account state
     */
    public AccountState getAccountState(String accountId) {
        return accountStates.get(accountId);
    }

    /**
     * Account state record
     */
    public record AccountState(
            String accountId,
            String ownerName,
            BigDecimal balance,
            List<String> history) {
    }
}
