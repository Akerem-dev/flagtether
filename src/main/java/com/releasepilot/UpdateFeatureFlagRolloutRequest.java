package com.releasepilot;

public class UpdateFeatureFlagRolloutRequest {

    private int rolloutPercentage;


    public UpdateFeatureFlagRolloutRequest() {
    }


    public int getRolloutPercentage() {
        return rolloutPercentage;
    }


    public void setRolloutPercentage(
            int rolloutPercentage
    ) {

        this.rolloutPercentage =
                rolloutPercentage;
    }
}