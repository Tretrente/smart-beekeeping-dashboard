package com.tretrente.smart_beekeeping_dashboard.model;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Represents one row from inspections_2021.csv:
 * - date: inspection date (e.g., "2021-01-15")
 * - tagNumber: hive identifier
 * - colonySize: number of frames occupied by bees (proxy for population)
 * - fob1st, fob2nd, fob3rd, foBrood: additional frame counts for adult bees and brood
 * - queenStatus: status of the queen
 * - framesOfHoney: number of frames filled with honey
 * - open, close: inspection start and end times (may be less relevant for the dashboard)
 * - notes: general remarks or observations
 */
@Getter
@Setter
public class Inspection2021Record {
    private LocalDate date;
    private String tagNumber;
    private int colonySize;
    private int fob1st;
    private int fob2nd;
    private int fob3rd;
    private int foBrood;
    private String queenStatus;
    private int framesOfHoney;
    private String open;
    private String close;
    private String notes;

    public Inspection2021Record() { }

    public Inspection2021Record(LocalDate date, String tagNumber, int colonySize,
                                int fob1st, int fob2nd, int fob3rd, int foBrood,
                                String queenStatus, int framesOfHoney,
                                String open, String close, String notes) {
        this.date = date;
        this.tagNumber = tagNumber;
        this.colonySize = colonySize;
        this.fob1st = fob1st;
        this.fob2nd = fob2nd;
        this.fob3rd = fob3rd;
        this.foBrood = foBrood;
        this.queenStatus = queenStatus;
        this.framesOfHoney = framesOfHoney;
        this.open = open;
        this.close = close;
        this.notes = notes;
    }
}
