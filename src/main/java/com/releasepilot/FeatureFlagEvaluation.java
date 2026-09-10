package com.releasepilot;


public class FeatureFlagEvaluation {

    private final String flagName;

    private final String environment;

    private final String userKey;

    private final boolean enabled;

    private final EvaluationReason reason;

    private final int rolloutPercentage;

    private final int bucket;

    private final Long matchedRuleId;


    public FeatureFlagEvaluation(
            String flagName,
            String environment,
            String userKey,
            boolean enabled,
            EvaluationReason reason,
            int rolloutPercentage,
            int bucket,
            Long matchedRuleId
    ) {

        this.flagName =
                flagName;

        this.environment =
                environment;

        this.userKey =
                userKey;

        this.enabled =
                enabled;

        this.reason =
                reason;

        this.rolloutPercentage =
                rolloutPercentage;

        this.bucket =
                bucket;

        this.matchedRuleId =
                matchedRuleId;
    }


    public String getFlagName() {

        return flagName;
    }


    public String getEnvironment() {

        return environment;
    }


    public String getUserKey() {

        return userKey;
    }


    public boolean isEnabled() {

        return enabled;
    }


    public EvaluationReason getReason() {

        return reason;
    }


    public int getRolloutPercentage() {

        return rolloutPercentage;
    }


    public int getBucket() {

        return bucket;
    }


    public Long getMatchedRuleId() {

        return matchedRuleId;
    }
}