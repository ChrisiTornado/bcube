package com.bcube.accessservice.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class NukiConfig {

    @Value("${nuki.api.token}")
    private String apiToken;

    @Value("${nuki.url}")
    private String nukiUrl;

    @Bean
    public RestClient nukiRestClient() {
        return RestClient.builder()
                .baseUrl(nukiUrl)
                .defaultHeader("Authorization", "Bearer " + apiToken)
                .build();
    }
}