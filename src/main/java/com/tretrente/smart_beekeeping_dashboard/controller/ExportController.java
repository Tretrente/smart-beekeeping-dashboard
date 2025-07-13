package com.tretrente.smart_beekeeping_dashboard.controller;

import com.tretrente.smart_beekeeping_dashboard.repository.InspectionRepository;
import com.tretrente.smart_beekeeping_dashboard.repository.SensorRepository;
import com.tretrente.smart_beekeeping_dashboard.repository.WeatherRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final InspectionRepository inspectionRepo;
    private final SensorRepository sensorRepo;
    private final WeatherRepository weatherRepo;

    @Autowired
    public ExportController(InspectionRepository inspectionRepo,
                            SensorRepository sensorRepo,
                            WeatherRepository weatherRepo) {
        this.inspectionRepo = inspectionRepo;
        this.sensorRepo     = sensorRepo;
        this.weatherRepo    = weatherRepo;
    }

    // --- INSPECTIONS CSV (come prima) ---
    @GetMapping(value = "/inspections.csv", produces = "text/csv")
    public void exportInspectionsCsv(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam("end")   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "tags", required = false) List<String> tagNumbers,
            HttpServletResponse resp
    ) throws IOException {
        resp.setHeader("Content-Disposition", "attachment; filename=inspections.csv");
        resp.setCharacterEncoding("UTF-8");

        String[] headers = {
                "Date","Tag","ColonySize",
                "Fob1st","Fob2nd","Fob3rd","FoBrood",
                "FramesHoney","QueenStatus",
                "Open","Close","Notes"
        };

        try (CSVPrinter printer = new CSVPrinter(resp.getWriter(),
                CSVFormat.DEFAULT.withHeader(headers))) {
            inspectionRepo.findAll().stream()
                    .filter(r -> !r.getDate().isBefore(startDate) && !r.getDate().isAfter(endDate))
                    .filter(r -> tagNumbers == null || tagNumbers.isEmpty() || tagNumbers.contains(r.getTagNumber()))
                    .forEach(r -> {
                        try {
                            printer.printRecord(
                                    r.getDate(),
                                    r.getTagNumber(),
                                    r.getColonySize(),
                                    r.getFob1st(),
                                    r.getFob2nd(),
                                    r.getFob3rd(),
                                    r.getFoBrood(),
                                    r.getFramesOfHoney(),
                                    r.getQueenStatus(),
                                    r.getOpen(),
                                    r.getClose(),
                                    r.getNotes()
                            );
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
        }
    }

    // --- SENSOR CSV ---
    @GetMapping(value = "/sensor.csv", produces = "text/csv")
    public void exportSensorCsv(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTs,
            @RequestParam("end")   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTs,
            @RequestParam(value = "tags", required = false) List<String> tagNumbers,
            HttpServletResponse resp
    ) throws IOException {
        resp.setHeader("Content-Disposition", "attachment; filename=sensor.csv");
        resp.setCharacterEncoding("UTF-8");

        String[] headers = { "Date","Tag","Temperature","Humidity" };

        try (CSVPrinter printer = new CSVPrinter(resp.getWriter(),
                CSVFormat.DEFAULT.withHeader(headers))) {
            sensorRepo.findAll().stream()
                    .filter(r -> !r.getDate().isBefore(startTs) && !r.getDate().isAfter(endTs))
                    .filter(r -> tagNumbers == null || tagNumbers.isEmpty() || tagNumbers.contains(r.getTagNumber()))
                    .forEach(r -> {
                        try {
                            printer.printRecord(
                                    r.getDate(),
                                    r.getTagNumber(),
                                    r.getTemperature(),
                                    r.getHumidity()
                            );
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
        }
    }

    // --- WEATHER CSV ---
    @GetMapping(value = "/weather.csv", produces = "text/csv")
    public void exportWeatherCsv(
            @RequestParam("start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTs,
            @RequestParam("end")   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTs,
            HttpServletResponse resp
    ) throws IOException {
        resp.setHeader("Content-Disposition", "attachment; filename=weather.csv");
        resp.setCharacterEncoding("UTF-8");

        String[] headers = { "DateTime","Temperature","Humidity","Precipitation" };

        try (CSVPrinter printer = new CSVPrinter(resp.getWriter(),
                CSVFormat.DEFAULT.withHeader(headers))) {
            weatherRepo.findAll().stream()
                    .filter(w -> !w.getDateTime().isBefore(startTs) && !w.getDateTime().isAfter(endTs))
                    .forEach(w -> {
                        try {
                            printer.printRecord(
                                    w.getDateTime(),
                                    w.getTemperature(),
                                    w.getHumidity(),
                                    w.getPrecipitation()
                            );
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    });
        }
    }
}
