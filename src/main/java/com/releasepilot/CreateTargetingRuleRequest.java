package com.releasepilot;


public class CreateTargetingRuleRequest {

    private String attribute;

    private String operator;

    private String comparisonValue;

    private boolean serveEnabled;

    private Integer priority;


    public CreateTargetingRuleRequest() {
    }


    public String getAttribute() {

        return attribute;
    }


    public void setAttribute(
            String attribute
    ) {

        this.attribute =
                attribute;
    }


    public String getOperator() {

        return operator;
    }


    public void setOperator(
            String operator
    ) {

        this.operator =
                operator;
    }


    public String getComparisonValue() {

        return comparisonValue;
    }


    public void setComparisonValue(
            String comparisonValue
    ) {

        this.comparisonValue =
                comparisonValue;
    }


    public boolean isServeEnabled() {

        return serveEnabled;
    }


    public void setServeEnabled(
            boolean serveEnabled
    ) {

        this.serveEnabled =
                serveEnabled;
    }


    public Integer getPriority() {

        return priority;
    }


    public void setPriority(
            Integer priority
    ) {

        this.priority =
                priority;
    }
}