package com.weatherintel.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Loads a repo-root {@code .env} into the Spring Environment so
 * {@code GEMINI_API_KEY} and other secrets work when Maven is started from {@code backend/}.
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DotenvEnvironmentPostProcessor.class);
    private static final String PROPERTY_SOURCE_NAME = "dotenvFile";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        if (environment.getPropertySources().contains(PROPERTY_SOURCE_NAME)) {
            return;
        }
        for (String profile : environment.getActiveProfiles()) {
            if ("test".equals(profile)) {
                return;
            }
        }

        Path envFile = findEnvFile();
        if (envFile == null) {
            log.debug("No .env file found; using process environment only");
            return;
        }

        Map<String, Object> properties = parseEnvFile(envFile);
        if (properties.isEmpty()) {
            return;
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
        log.info("Loaded {} environment entries from {}", properties.size(), envFile.toAbsolutePath());
    }

    private static Path findEnvFile() {
        Path cwd = Path.of("").toAbsolutePath();
        Path[] candidates = {
                cwd.resolve(".env"),
                cwd.getParent() != null ? cwd.getParent().resolve(".env") : null,
                cwd.resolve("../.env").normalize()
        };
        for (Path candidate : candidates) {
            if (candidate != null && Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return null;
    }

    private static Map<String, Object> parseEnvFile(Path envFile) {
        Map<String, Object> properties = new LinkedHashMap<>();
        try {
            for (String rawLine : Files.readAllLines(envFile, StandardCharsets.UTF_8)) {
                String line = rawLine.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int idx = line.indexOf('=');
                String key = line.substring(0, idx).trim();
                String value = unquote(line.substring(idx + 1).trim());
                if (!key.isEmpty()) {
                    properties.put(key, value);
                }
            }
        } catch (IOException ex) {
            log.warn("Failed to read .env from {}: {}", envFile, ex.getMessage());
        }
        return properties;
    }

    private static String unquote(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
