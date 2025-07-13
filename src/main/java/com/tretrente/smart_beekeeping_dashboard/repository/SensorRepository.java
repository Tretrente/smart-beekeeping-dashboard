package com.tretrente.smart_beekeeping_dashboard.repository;

import com.tretrente.smart_beekeeping_dashboard.model.SensorRecord;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Repository;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Repository to load temperature and humidity readings from sensor_2021.csv.
 */
@Repository
public class SensorRepository {

    // Path to the 2021 sensor CSV
    private static final String CSV_PATH = "data/urban/sensor_2021.csv";

    /**
     * Formatter for timestamps in format "yyyy-MM-dd HH:mm:ssXXX",
     *
     */
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ssXXX");

    public List<SensorRecord> findAll() {
        List<SensorRecord> result = new ArrayList<>();

        try {
            var resource = new ClassPathResource(CSV_PATH);
            var reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)
            );

            CSVFormat format = CSVFormat.DEFAULT
                    .withFirstRecordAsHeader()
                    .withIgnoreHeaderCase()
                    .withTrim();

            CSVParser parser = format.parse(reader);

            for (CSVRecord record : parser) {
                String dateStr = record.get("Date");
                OffsetDateTime odt = OffsetDateTime.parse(dateStr, FORMATTER);
                LocalDateTime dateTime = odt.toLocalDateTime();

                String tagNumber = record.get("Tag number");
                double temp     = Double.parseDouble(record.get("temperature"));
                double humidity = Double.parseDouble(record.get("humidity"));

                SensorRecord sr = new SensorRecord(dateTime, tagNumber, temp, humidity);
                result.add(sr);
            }

            parser.close();
        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }
}
