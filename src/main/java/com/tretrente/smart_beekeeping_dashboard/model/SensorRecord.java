package com.tretrente.smart_beekeeping_dashboard.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represents one row from sensor_2021.csv:
 * - date: timestamp as LocalDateTime (e.g., "2021-03-01T14:00:00")
 * - tagNumber: hive identifier (e.g., "hive1", "hive2", …)
 * - temperature: in °C
 * - humidity: in %
 */
@Getter
@Setter
public class SensorRecord {
    private LocalDateTime date;
    private String tagNumber;
    private double temperature;
    private double humidity;

    public SensorRecord() { }

    public SensorRecord(LocalDateTime date, String tagNumber, double temperature, double humidity) {
        this.date = date;
        this.tagNumber = tagNumber;
        this.temperature = temperature;
        this.humidity = humidity;
    }
}
