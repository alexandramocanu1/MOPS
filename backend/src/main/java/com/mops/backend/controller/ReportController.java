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

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReportDTO> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        MonthlyReportDTO report = reportService.generateMonthlyReport(year, month);
        return ResponseEntity.ok(report);
    }
}
