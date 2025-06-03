package com.tretrente.smart_beekeeping_dashboard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

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
        // Provide default hive IDs for the template
        model.addAttribute("defaultHiveIds", "hive1,hive2,hive3");
        return "dashboard";
    }
}
