package com.releasepilot;

import java.time.LocalDateTime;


public class AuditLogEntry {

    private final long id;

    private final AuditAction action;

    private final String flagName;

    private final String environment;

    private final String details;

    private final LocalDateTime createdAt;


    public AuditLogEntry(
            long id,
            AuditAction action,
            String flagName,
            String environment,
            String details,
            LocalDateTime createdAt
    ) {

        this.id =
                id;

        this.action =
                action;

        this.flagName =
                flagName;

        this.environment =
                environment;

        this.details =
                details;

        this.createdAt =
                createdAt;
    }


    public long getId() {

        return id;
    }


    public AuditAction getAction() {

        return action;
    }


    public String getFlagName() {

        return flagName;
    }


    public String getEnvironment() {

        return environment;
    }


    public String getDetails() {

        return details;
    }


    public LocalDateTime getCreatedAt() {

        return createdAt;
    }
}