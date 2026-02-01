package com.learning.kafka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.kafka.annotation.EnableKafka;

/**
 * Kafka Learning Application
 * 
 * Demonstrates various Kafka patterns and use cases:
 * - Basic Producer/Consumer
 * - Idempotent Producer
 * - Transactional Producer (Exactly-Once)
 * - Consumer Groups & Rebalancing
 * - Dead Letter Queue
 * - Event Sourcing
 */
@SpringBootApplication
@EnableKafka
public class KafkaLearningApplication {

    public static void main(String[] args) {
        SpringApplication.run(KafkaLearningApplication.class, args);
    }
}
