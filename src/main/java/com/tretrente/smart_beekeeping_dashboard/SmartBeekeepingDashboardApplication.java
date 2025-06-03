package com.tretrente.smart_beekeeping_dashboard;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main entry point for the Smart Beekeeping Dashboard application.
 * <p>
 * This class boots the Spring Boot context and starts the embedded web server.
 * </p>
 */
@SpringBootApplication
public class SmartBeekeepingDashboardApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartBeekeepingDashboardApplication.class, args);
	}

}
