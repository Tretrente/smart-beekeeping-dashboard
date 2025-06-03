package com.tretrente.smart_beekeeping_dashboard.repository;

import com.tretrente.smart_beekeeping_dashboard.model.WeatherRecord;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Repository to load all entries from weather_2021.csv.
 * Handles empty numeric fields by defaulting to 0.
 */
@Repository
public class WeatherRepository {

    // Path to the CSV file under resources/data/urban
    private static final String CSV_PATH = "data/urban/weather_2021.csv";

    // Formatter for timestamps in format "yyyy-MM-dd HH:mm:ss"
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Reads the CSV, parses each row, and returns a list of WeatherRecord.
     *
     * @return List of WeatherRecord for 2021
     */
    public List<WeatherRecord> findAll() {
        List<WeatherRecord> result = new ArrayList<>();

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
                String dateStr = record.get("Date/Time (LST)"); // e.g. "2021-06-01 00:00:00"
                LocalDateTime dateTime = LocalDateTime.parse(dateStr, FORMATTER);

                // “Temp (°C)” might be empty or something unexpected → default to 0
                double temperature   = parseDoubleOrZero(record.get("Temp (°C)"));
                double humidity      = parseDoubleOrZero(record.get("Rel Hum (%)"));
                double precipitation = parseDoubleOrZero(record.get("Precip. Amount (mm)"));

                WeatherRecord wr = new WeatherRecord(dateTime, temperature, humidity, precipitation);
                result.add(wr);
            }

            parser.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    /**
     * Parse a String to double, returning 0 if empty or invalid.
     */
    private double parseDoubleOrZero(String raw) {
        if (raw == null || raw.isBlank()) {
            return 0.0;
        }
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException ex) {
            return 0.0;
        }
    }
}
