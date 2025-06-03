package com.tretrente.smart_beekeeping_dashboard.service;

import com.tretrente.smart_beekeeping_dashboard.model.EnvironmentalData;
import com.tretrente.smart_beekeeping_dashboard.model.ProductionData;
import com.tretrente.smart_beekeeping_dashboard.util.RandomUtil;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service responsible for simulating environmental and production data for beekeeping.
 * Generates lists of data points based on simple statistical models.
 */
@Service
public class DataSimulatorService {

    /**
     * Simulate environmental data for a given time range with a fixed time step (e.g., hourly).
     *
     * @param start Starting timestamp (inclusive)
     * @param end   Ending timestamp (exclusive)
     * @return List of EnvironmentalData
     */
    public List<EnvironmentalData> generateEnvironmentalData(LocalDateTime start, LocalDateTime end) {
        List<EnvironmentalData> result = new ArrayList<>();
        LocalDateTime current = start;

        while (current.isBefore(end)) {
            double temp = RandomUtil.gaussian(20.0, 5.0);               // e.g. mean 20°C, standard deviation 5
            double humidity = RandomUtil.uniform(40.0, 90.0);            // humidity between 40% and 90%
            double precipitation = RandomUtil.uniform(0.0, 10.0);        // mm of rain
            double flowerIndex = computeFlowerIndex(current);            // calculate flower availability index

            EnvironmentalData data = new EnvironmentalData(current, temp, humidity, precipitation, flowerIndex);
            result.add(data);

            // Advance by 1 hour
            current = current.plusHours(1);
        }
        return result;
    }

    /**
     * Compute a simplified flower availability index (0.0–1.0) based on the month.
     * Peak bloom in spring/early summer (March–June), lower availability in winter.
     *
     * @param timestamp LocalDateTime used to determine the month
     * @return Double between 0.0 and 1.0 representing flower availability
     */
    private double computeFlowerIndex(LocalDateTime timestamp) {
        int month = timestamp.getMonthValue();
        switch (month) {
            case 3, 4, 5, 6:
                return RandomUtil.uniform(0.7, 1.0);  // spring/early summer
            case 7, 8:
                return RandomUtil.uniform(0.4, 0.7);  // midsummer
            case 9, 10:
                return RandomUtil.uniform(0.3, 0.6);  // early autumn
            default:
                return RandomUtil.uniform(0.0, 0.3);  // late autumn/winter
        }
    }

    /**
     * Simulate production data (honey quantity) per hive for each timestamp in the range.
     *
     * @param start   Starting timestamp
     * @param end     Ending timestamp
     * @param hiveIds List of hive identifiers
     * @return List of ProductionData
     */
    public List<ProductionData> generateProductionData(LocalDateTime start, LocalDateTime end, List<String> hiveIds) {
        List<ProductionData> result = new ArrayList<>();
        LocalDateTime current = start;

        while (current.isBefore(end)) {
            // Get the flower availability index for this timestamp
            double flowerIndex = computeFlowerIndex(current);

            for (String hiveId : hiveIds) {
                // Honey yield depends on flowerIndex plus some random noise
                double baseYield = flowerIndex * 2.0;              // up to 2 kg of honey per day at peak
                double noise = RandomUtil.gaussian(0.0, 0.3);       // random variability
                double honeyQty = Math.max(0.0, baseYield + noise);

                ProductionData pd = new ProductionData(hiveId, current, honeyQty);
                result.add(pd);
            }

            // Advance by 1 day (assuming daily production)
            current = current.plusDays(1);
        }

        return result;
    }
}
