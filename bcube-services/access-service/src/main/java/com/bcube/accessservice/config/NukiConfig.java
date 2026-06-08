package com.bcube.accessservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Configuration
public class NukiConfig {

    @Value("${nuki.api.token}")
    private String apiToken;

    @Value("${nuki.url}")
    private String nukiUrl;

    @Bean
    public RestClient nukiRestClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        return RestClient.builder()
                .requestFactory(factory)
                .baseUrl(nukiUrl)
                .defaultHeader("Authorization", "Bearer " + apiToken)
                .build();
    }
}