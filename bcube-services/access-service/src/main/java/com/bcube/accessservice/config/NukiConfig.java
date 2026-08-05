package com.bcube.accessservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
public class NukiConfig {

    @Value("${nuki.api.token}")
    private String apiToken;

    @Value("${nuki.url}")
    private String nukiUrl;

    /**
     * Without an explicit timeout, a hanging Nuki API call would block the calling request
     * thread indefinitely instead of failing fast.
     */
    @Bean
    public RestClient nukiRestClient() {
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
        requestFactory.setReadTimeout(Duration.ofSeconds(10));

        return RestClient.builder()
                .baseUrl(nukiUrl)
                .requestFactory(requestFactory)
                .defaultHeader("Authorization", "Bearer " + apiToken)
                .build();
    }
}