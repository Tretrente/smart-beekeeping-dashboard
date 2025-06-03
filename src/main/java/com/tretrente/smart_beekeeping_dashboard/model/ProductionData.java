package com.tretrente.smart_beekeeping_dashboard.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Represents production data for a given hive at a specific timestamp.
 * Attributes include hiveId (String), honeyQuantity (kg), and timestamp.
 */
@Setter
@Getter
public class ProductionData {
    private String hiveId;
    private LocalDateTime timestamp;
    private double honeyQuantity;

    /**
     * No-argument constructor.
     */
    public ProductionData() {
    }

    /**
     * Full-argument constructor.
     *
     * @param hiveId        Unique identifier for the hive
     * @param timestamp     Date and time of the data point
     * @param honeyQuantity Quantity of honey produced (kg)
     */
    public ProductionData(String hiveId, LocalDateTime timestamp, double honeyQuantity) {
        this.hiveId = hiveId;
        this.timestamp = timestamp;
        this.honeyQuantity = honeyQuantity;
    }

}
