package com.tretrente.smart_beekeeping_dashboard.repository;

import com.tretrente.smart_beekeeping_dashboard.model.Inspection2021Record;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Repository to load hive inspection data for 2021 from inspections_2021.csv.
 * Handles numeric fields that may be in "6.0" format or empty.
 */
@Repository
public class InspectionRepository {

    // Path to the 2021 inspections CSV (inside src/main/resources/data/urban/)
    private static final String CSV_PATH = "data/urban/inspections_2021.csv";

    // Formatter for the date field in format "yyyy-MM-dd"
    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /**
     * Reads all rows from inspections_2021.csv and returns a list of Inspection2021Record.
     *
     * @return List of Inspection2021Record for 2021
     */
    public List<Inspection2021Record> findAll() {
        List<Inspection2021Record> result = new ArrayList<>();

        try {
            ClassPathResource resource = new ClassPathResource(CSV_PATH);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)
            );

            CSVFormat format = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreHeaderCase()
                    .withTrim();

            CSVParser parser = format.parse(reader);

            for (CSVRecord record : parser) {
                // Parse date
                LocalDate date = LocalDate.parse(record.get("Date"), DATE_FORMATTER);
                String tagNumber = record.get("Tag number");

                // Helper to parse integer-like fields that may be "6.0" or empty
                int colonySize = parseIntFromPossiblyDecimal(record.get("Colony Size"));
                int fob1st     = parseIntFromPossiblyDecimal(record.get("Fob 1st"));
                int fob2nd     = parseIntFromPossiblyDecimal(record.get("Fob 2nd"));
                int fob3rd     = parseIntFromPossiblyDecimal(record.get("Fob 3rd"));
                int foBrood    = parseIntFromPossiblyDecimal(record.get("FoBrood"));
                String queenStatus = record.get("Queen status");
                int framesOfHoney  = parseIntFromPossiblyDecimal(record.get("Frames of Honey"));

                String open  = record.get("Open");
                String close = record.get("Close");
                String notes = record.get("Notes");

                Inspection2021Record rec = new Inspection2021Record(
                        date,
                        tagNumber,
                        colonySize,
                        fob1st, fob2nd, fob3rd,
                        foBrood,
                        queenStatus,
                        framesOfHoney,
                        open, close,
                        notes
                );

                result.add(rec);
            }

            parser.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    /**
     * If the input is null, empty, or something like "6.0", convert to int.
     * Returns 0 if empty or unparsable.
     */
    private int parseIntFromPossiblyDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0;
        }
        try {
            // Double.parseDouble handles "6.0" as 6.0
            double d = Double.parseDouble(raw);
            return (int) d;
        } catch (NumberFormatException ex) {
            return 0;
        }
    }
}
