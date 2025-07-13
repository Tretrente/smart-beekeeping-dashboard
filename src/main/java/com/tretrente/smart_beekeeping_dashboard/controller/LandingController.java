package com.tretrente.smart_beekeeping_dashboard.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LandingController {

    @GetMapping({"/", "/landing"})
    public String landing(Model model) {
        // supply the same defaults your dashboard needs
        model.addAttribute("defaultStart",   "2021-06-01");
        model.addAttribute("defaultEnd",     "2021-08-30");
        model.addAttribute("defaultHiveIds", "hive1,hive2,hive3");
        return "landing";
    }
}
