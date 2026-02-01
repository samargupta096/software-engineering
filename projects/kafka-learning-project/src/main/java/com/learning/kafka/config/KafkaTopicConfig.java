package com.learning.kafka.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Kafka Topic Configuration
 * 
 * Demonstrates proper topic creation with partitioning and replication
 * settings.
 */
@Configuration
public class KafkaTopicConfig {

    @Value("${app.kafka.topics.orders}")
    private String ordersTopic;

    @Value("${app.kafka.topics.payments}")
    private String paymentsTopic;

    @Value("${app.kafka.topics.inventory}")
    private String inventoryTopic;

    @Value("${app.kafka.topics.dead-letter}")
    private String deadLetterTopic;

    @Value("${app.kafka.topics.account-events}")
    private String accountEventsTopic;

    @Bean
    public NewTopic ordersTopic() {
        return TopicBuilder.name(ordersTopic)
                .partitions(3) // 3 partitions for parallelism
                .replicas(1) // 1 replica for local dev (use 3 in prod)
                // .compact(false) // Delete old messages based on retention
                .build();
    }

    @Bean
    public NewTopic paymentsTopic() {
        return TopicBuilder.name(paymentsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic inventoryTopic() {
        return TopicBuilder.name(inventoryTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic deadLetterTopic() {
        return TopicBuilder.name(deadLetterTopic)
                .partitions(1) // Single partition for DLQ
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic accountEventsTopic() {
        // Event sourcing topic - use log compaction
        return TopicBuilder.name(accountEventsTopic)
                .partitions(6) // More partitions for high throughput
                .replicas(1)
                .config("cleanup.policy", "compact") // Keep latest per key
                .config("min.compaction.lag.ms", "0")
                .build();
    }
}
