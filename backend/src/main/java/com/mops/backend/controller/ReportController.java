package com.mops.backend.controller;

import com.mops.backend.dto.MonthlyReportDTO;
import com.mops.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001", "http://localhost:5173"})
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/generate")
    public ResponseEntity<MonthlyReportDTO> getReport(
            @RequestParam int year,
            @RequestParam(required = false, defaultValue = "1") int month,
            @RequestParam boolean isAnnual,
            @RequestParam(required = false, defaultValue = "0") int months) {

        MonthlyReportDTO report = reportService.generateReport(year, month, isAnnual, months);
        return ResponseEntity.ok(report);
    }
}
