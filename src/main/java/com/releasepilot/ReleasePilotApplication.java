package com.releasepilot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReleasePilotApplication {

    public static void main(String[] args) {

        // Spring Boot uygulamasini baslatir.
        //
        // Bu cagri:
        // - Spring sistemini hazirlar
        // - component'leri bulur
        // - gerekli auto-configuration'lari yapar
        // - web server'i baslatir
        //
        // Birazdan bunlarin her birini ayrica ogrenecegiz.
        SpringApplication.run(
                ReleasePilotApplication.class,
                args
        );
    }
}