package com.tretrente.smart_beekeeping_dashboard.util;

import org.apache.commons.math3.distribution.NormalDistribution;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Utility class providing methods to generate random values
 * according to desired statistical distributions.
 */
public class RandomUtil {

    /**
     * Generate a random double following a normal distribution.
     *
     * @param mean Mean value
     * @param sd   Standard deviation
     * @return Random sample (double)
     */
    public static double gaussian(double mean, double sd) {
        NormalDistribution dist = new NormalDistribution(mean, sd);
        return dist.sample();
    }

    /**
     * Generate a random double between min and max uniformly.
     *
     * @param min Lower bound
     * @param max Upper bound
     * @return Random sample (double)
     */
    public static double uniform(double min, double max) {
        return ThreadLocalRandom.current().nextDouble(min, max);
    }

    /**
     * Generate a random integer between min and max (inclusive).
     *
     * @param min Lower bound (int)
     * @param max Upper bound (int)
     * @return Random integer
     */
    public static int uniformInt(int min, int max) {
        return ThreadLocalRandom.current().nextInt(min, max + 1);
    }
}
