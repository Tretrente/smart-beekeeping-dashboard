package com.tretrente.smart_beekeeping_dashboard.controller;

import com.tretrente.smart_beekeeping_dashboard.model.EnvironmentalData;
import com.tretrente.smart_beekeeping_dashboard.model.ProductionData;
import com.tretrente.smart_beekeeping_dashboard.model.WeatherRecord;
import com.tretrente.smart_beekeeping_dashboard.model.Inspection2021Record;
import com.tretrente.smart_beekeeping_dashboard.repository.WeatherRepository;
import com.tretrente.smart_beekeeping_dashboard.repository.InspectionRepository;
import com.tretrente.smart_beekeeping_dashboard.service.DataSimulatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * REST controller exposing both simulated data endpoints and 2021 UrBAN data endpoints.
 */
@RestController
@RequestMapping("/api")
public class DataApiController {

    private final DataSimulatorService simulatorService;
    private final WeatherRepository weatherRepo;
    private final InspectionRepository inspectionRepo;

    @Autowired
    public DataApiController(
            DataSimulatorService simulatorService,
            WeatherRepository weatherRepo,
            InspectionRepository inspection2021Repo) {
        this.simulatorService = simulatorService;
        this.weatherRepo = weatherRepo;
        this.inspectionRepo = inspection2021Repo;
    }

    /**
     * GET /api/environmental?start={}&end={}
     * Returns a list of simulated EnvironmentalData between specified timestamps.
     *
     * @param start ISO-8601 timestamp string, e.g. 2025-06-01T00:00:00
     * @param end   ISO-8601 timestamp string, e.g. 2025-06-02T00:00:00
     * @return List of EnvironmentalData
     */
    @GetMapping("/environmental")
    public List<EnvironmentalData> getEnvironmentalData(
            @RequestParam("start")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,
            @RequestParam("end")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end) {
        return simulatorService.generateEnvironmentalData(start, end);
    }

    /**
     * GET /api/production?start={}&end={}&hives={comma-separated IDs}
     * Returns a list of simulated ProductionData between specified timestamps for given hive IDs.
     *
     * @param start ISO-8601 timestamp string
     * @param end   ISO-8601 timestamp string
     * @param hives Comma-separated list of hive identifiers, e.g. "hive1,hive2"
     * @return List of ProductionData
     */
    @GetMapping("/production")
    public List<ProductionData> getProductionData(
            @RequestParam("start")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime start,
            @RequestParam("end")
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime end,
            @RequestParam("hives") String hives) {
        List<String> hiveIds = Arrays.asList(hives.split(","));
        return simulatorService.generateProductionData(start, end, hiveIds);
    }

    /**
     * GET /api/urban/environmental
     * Returns all 2021 weather records (WeatherRecord objects) from the UrBAN dataset.
     */
    @GetMapping("/urban/environmental")
    public List<WeatherRecord> getUrbanEnvironmentalData() {
        return weatherRepo.findAll();
    }

    /**
     * GET /api/urban/inspections/2021
     * Returns all 2021 inspection records (Inspection2021Record objects) from the UrBAN dataset.
     */
    @GetMapping("/urban/inspections/2021")
    public List<Inspection2021Record> getUrbanInspectionData2021() {
        return inspectionRepo.findAll();
    }
}
