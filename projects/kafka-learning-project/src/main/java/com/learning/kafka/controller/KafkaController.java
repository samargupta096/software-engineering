package com.learning.kafka.controller;

import com.learning.kafka.model.OrderEvent;
import com.learning.kafka.producer.BasicProducer;
import com.learning.kafka.producer.TransactionalProducer;
import com.learning.kafka.usecases.EventSourcingUseCase;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

/**
 * REST API Controller for Kafka demonstrations
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class KafkaController {

    private final BasicProducer basicProducer;
    private final TransactionalProducer transactionalProducer;
    private final EventSourcingUseCase eventSourcingUseCase;

    // ==================== Basic Producer ====================

    @PostMapping("/orders")
    public ResponseEntity<Map<String, Object>> sendOrder(@RequestBody OrderRequest request) {
        OrderEvent order = OrderEvent.create(request.userId(), request.amount());
        basicProducer.sendOrder(order);

        return ResponseEntity.ok(Map.of(
                "status", "sent",
                "orderId", order.orderId(),
                "message", "Order sent to Kafka"));
    }

    @PostMapping("/orders/sync")
    public ResponseEntity<Map<String, Object>> sendOrderSync(@RequestBody OrderRequest request) {
        OrderEvent order = OrderEvent.create(request.userId(), request.amount());
        var result = basicProducer.sendOrderSync(order);

        return ResponseEntity.ok(Map.of(
                "status", "confirmed",
                "orderId", order.orderId(),
                "partition", result.getRecordMetadata().partition(),
                "offset", result.getRecordMetadata().offset()));
    }

    // ==================== Transactional Producer ====================

    @PostMapping("/orders/transactional")
    public ResponseEntity<Map<String, Object>> sendTransactionalOrder(@RequestBody OrderRequest request) {
        OrderEvent order = OrderEvent.create(request.userId(), request.amount());

        try {
            transactionalProducer.processOrderTransactionally(order);
            return ResponseEntity.ok(Map.of(
                    "status", "committed",
                    "orderId", order.orderId(),
                    "message", "Order and Payment sent atomically"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "aborted",
                    "error", e.getMessage()));
        }
    }

    // ==================== Event Sourcing ====================

    @PostMapping("/accounts")
    public ResponseEntity<Map<String, Object>> createAccount(@RequestBody AccountRequest request) {
        eventSourcingUseCase.createAccount(request.accountId(), request.ownerName());

        return ResponseEntity.ok(Map.of(
                "status", "created",
                "accountId", request.accountId()));
    }

    @PostMapping("/accounts/{accountId}/deposit")
    public ResponseEntity<Map<String, Object>> deposit(
            @PathVariable String accountId,
            @RequestBody TransactionRequest request) {

        eventSourcingUseCase.deposit(accountId, request.amount(), request.description());

        return ResponseEntity.ok(Map.of(
                "status", "deposited",
                "accountId", accountId,
                "amount", request.amount()));
    }

    @PostMapping("/accounts/{accountId}/withdraw")
    public ResponseEntity<Map<String, Object>> withdraw(
            @PathVariable String accountId,
            @RequestBody TransactionRequest request) {

        eventSourcingUseCase.withdraw(accountId, request.amount(), request.description());

        return ResponseEntity.ok(Map.of(
                "status", "withdrawn",
                "accountId", accountId,
                "amount", request.amount()));
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<EventSourcingUseCase.AccountState> getAccountState(
            @PathVariable String accountId) {

        var state = eventSourcingUseCase.getAccountState(accountId);
        if (state == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(state);
    }

    @PostMapping("/accounts/{accountId}/replay")
    public ResponseEntity<EventSourcingUseCase.AccountState> replayEvents(
            @PathVariable String accountId) {

        var state = eventSourcingUseCase.replayEvents(accountId);
        if (state == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(state);
    }

    // ==================== Request DTOs ====================

    record OrderRequest(String userId, BigDecimal amount) {
    }

    record AccountRequest(String accountId, String ownerName) {
    }

    record TransactionRequest(BigDecimal amount, String description) {
    }
}
