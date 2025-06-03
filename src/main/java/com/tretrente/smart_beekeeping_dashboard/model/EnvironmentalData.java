package com.tretrente.smart_beekeeping_dashboard.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represents environmental data for a given timestamp in apiary simulation.
 * Includes temperature (°C), humidity (%), precipitation (mm),
 * and flowerAvailabilityIndex (range 0.0–1.0).
 */
@Setter
@Getter
public class EnvironmentalData {
    private LocalDateTime timestamp;
    private double temperature;
    private double humidity;
    private double precipitation;
    private double flowerAvailabilityIndex;

    /**
     * No-argument constructor.
     */
    public EnvironmentalData() {
    }

    /**
     * Full-argument constructor.
     *
     * @param timestamp             Date and time of the data point
     * @param temperature           Temperature in degrees Celsius
     * @param humidity              Relative humidity in percent
     * @param precipitation         Precipitation in millimeters
     * @param flowerAvailabilityIndex Flower availability index (0.0–1.0)
     */
    public EnvironmentalData(LocalDateTime timestamp, double temperature,
                             double humidity, double precipitation,
                             double flowerAvailabilityIndex) {
        this.timestamp = timestamp;
        this.temperature = temperature;
        this.humidity = humidity;
        this.precipitation = precipitation;
        this.flowerAvailabilityIndex = flowerAvailabilityIndex;
    }

}
