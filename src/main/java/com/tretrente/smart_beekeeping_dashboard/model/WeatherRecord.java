package com.tretrente.smart_beekeeping_dashboard.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represents one row from weather_2021.csv:
 * - dateTime: timestamp in local standard time, parsed into LocalDateTime
 * - temperature: temperature in °C
 * - humidity: relative humidity in %
 * - precipitation: precipitation amount in mm
 */
@Getter
@Setter
public class WeatherRecord {
    private LocalDateTime dateTime;
    private double temperature;
    private double humidity;
    private double precipitation;

    public WeatherRecord() { }

    public WeatherRecord(LocalDateTime dateTime, double temperature, double humidity, double precipitation) {
        this.dateTime = dateTime;
        this.temperature = temperature;
        this.humidity = humidity;
        this.precipitation = precipitation;
    }
}
