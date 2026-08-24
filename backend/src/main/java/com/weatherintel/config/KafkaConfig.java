package com.weatherintel.config;

import com.weatherintel.dto.WeatherEventDto;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.*;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableKafka
public class KafkaConfig {

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    @Value("${kafka.topic.weather-events:weather-events}")
    private String weatherEventsTopic;

    @Value("${kafka.consumer.group-id:weather-intelligence-group}")
    private String consumerGroupId;

    // Provision Kafka Topic automatically on local/dev cluster
    @Bean
    public NewTopic weatherEventsTopic() {
        return TopicBuilder.name(weatherEventsTopic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    // Producer Factory Configuration
    @Bean
    public ProducerFactory<String, WeatherEventDto> producerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        configProps.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(configProps);
    }

    // Kafka Template
    @Bean
    public KafkaTemplate<String, WeatherEventDto> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    // Consumer Factory Configuration
    @Bean
    public ConsumerFactory<String, WeatherEventDto> consumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ConsumerConfig.GROUP_ID_CONFIG, consumerGroupId);
        configProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        
        JsonDeserializer<WeatherEventDto> jsonDeserializer = new JsonDeserializer<>(WeatherEventDto.class);
        jsonDeserializer.addTrustedPackages("com.weatherintel.dto", "com.weatherintel.*");
        jsonDeserializer.setRemoveTypeHeaders(false);
        jsonDeserializer.setUseTypeMapperForKey(true);

        return new DefaultKafkaConsumerFactory<>(
                configProps,
                new StringDeserializer(),
                jsonDeserializer
        );
    }

    // Listener Container Factory
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, WeatherEventDto> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, WeatherEventDto> factory =
                new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}
