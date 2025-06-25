package com.tretrente.smart_beekeeping_dashboard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.LocalDate;

/**
 * MVC controller to serve the main dashboard page.
 */
@Controller
public class DashboardController {

    /**
     * GET /
     * Serves the dashboard view.
     *
     * @param model Model object to pass attributes to the template
     * @return Name of the Thymeleaf template (dashboard.html)
     */
    @GetMapping("/")
    public String showDashboard(Model model) {
        model.addAttribute("defaultHiveIds", "hive1,hive2,hive3");
        LocalDate today = LocalDate.now();
        model.addAttribute("defaultEnd", "2021-08-30");
        model.addAttribute("defaultStart", "2021-06-01");
        return "dashboard";
    }
}
