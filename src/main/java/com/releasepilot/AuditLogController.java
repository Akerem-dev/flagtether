package com.releasepilot;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    private final AuditLogService auditLogService;


    public AuditLogController(
            AuditLogService auditLogService
    ) {

        this.auditLogService =
                auditLogService;
    }


    @GetMapping
    public List<AuditLogEntry> getRecentAuditLogs(
            @RequestParam(
                    defaultValue = "50"
            )
            int limit
    ) {

        return auditLogService.getRecent(
                limit
        );
    }
}