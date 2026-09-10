package com.releasepilot;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import java.util.List;
import java.util.Locale;


@Service
public class FeatureFlagEvaluationService {

    private final FeatureFlagService featureFlagService;

    private final TargetingRuleService targetingRuleService;


    public FeatureFlagEvaluationService(
            FeatureFlagService featureFlagService,
            TargetingRuleService targetingRuleService
    ) {

        this.featureFlagService =
                featureFlagService;

        this.targetingRuleService =
                targetingRuleService;
    }


    public FeatureFlagEvaluation evaluate(
            String flagName,
            String userKey
    ) {

        return evaluate(
                flagName,
                "dev",
                userKey,
                null,
                null,
                null
        );
    }


    public FeatureFlagEvaluation evaluate(
            String flagName,
            String environment,
            String userKey
    ) {

        return evaluate(
                flagName,
                environment,
                userKey,
                null,
                null,
                null
        );
    }


    public FeatureFlagEvaluation evaluate(
            String flagName,
            String environment,
            String userKey,
            String country,
            String plan,
            String email
    ) {

        validateUserKey(
                userKey
        );


        FeatureFlag flag =
                featureFlagService.getFlagByName(
                        flagName,
                        environment
                );


        int rolloutPercentage =
                flag.getRolloutPercentage();


        if (!flag.isEnabled()) {

            return result(
                    flag,
                    userKey,
                    false,
                    EvaluationReason.FLAG_DISABLED,
                    -1,
                    null
            );
        }


        List<TargetingRule> rules =
                targetingRuleService.getRules(
                        flag.getName(),
                        flag.getEnvironment()
                );


        for (TargetingRule rule : rules) {

            String actualValue =
                    getContextValue(
                            rule.getAttribute(),
                            userKey,
                            country,
                            plan,
                            email
                    );


            if (actualValue == null) {

                continue;
            }


            if (
                    matches(
                            actualValue,
                            rule
                    )
            ) {

                return result(
                        flag,
                        userKey,
                        rule.isServeEnabled(),
                        EvaluationReason.TARGETING_MATCH,
                        -1,
                        rule.getId()
                );
            }
        }


        if (rolloutPercentage == 0) {

            return result(
                    flag,
                    userKey,
                    false,
                    EvaluationReason.ROLLOUT_ZERO,
                    -1,
                    null
            );
        }


        if (rolloutPercentage == 100) {

            return result(
                    flag,
                    userKey,
                    true,
                    EvaluationReason.ROLLOUT_FULL,
                    -1,
                    null
            );
        }


        int bucket =
                calculateBucket(
                        flag.getEnvironment(),
                        flag.getName(),
                        userKey
                );


        boolean enabledForUser =
                bucket < rolloutPercentage;


        EvaluationReason reason =
                enabledForUser
                        ? EvaluationReason.ROLLOUT_MATCH
                        : EvaluationReason.ROLLOUT_MISS;


        return result(
                flag,
                userKey,
                enabledForUser,
                reason,
                bucket,
                null
        );
    }


    private FeatureFlagEvaluation result(
            FeatureFlag flag,
            String userKey,
            boolean enabled,
            EvaluationReason reason,
            int bucket,
            Long matchedRuleId
    ) {

        return new FeatureFlagEvaluation(
                flag.getName(),
                flag.getEnvironment(),
                userKey,
                enabled,
                reason,
                flag.getRolloutPercentage(),
                bucket,
                matchedRuleId
        );
    }


    private String getContextValue(
            String attribute,
            String userKey,
            String country,
            String plan,
            String email
    ) {

        return switch (attribute) {

            case "userkey" ->
                    userKey;

            case "country" ->
                    country;

            case "plan" ->
                    plan;

            case "email" ->
                    email;

            default ->
                    null;
        };
    }


    private boolean matches(
            String actualValue,
            TargetingRule rule
    ) {

        String actual =
                actualValue
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        String expected =
                rule.getComparisonValue()
                        .trim()
                        .toLowerCase(
                                Locale.ROOT
                        );


        return switch (rule.getOperator()) {

            case EQUALS ->
                    actual.equals(
                            expected
                    );

            case NOT_EQUALS ->
                    !actual.equals(
                            expected
                    );

            case CONTAINS ->
                    actual.contains(
                            expected
                    );

            case STARTS_WITH ->
                    actual.startsWith(
                            expected
                    );

            case ENDS_WITH ->
                    actual.endsWith(
                            expected
                    );
        };
    }


    private int calculateBucket(
            String environment,
            String flagName,
            String userKey
    ) {

        String input =
                environment
                        + ":"
                        + flagName
                        + ":"
                        + userKey;


        try {

            MessageDigest digest =
                    MessageDigest.getInstance(
                            "SHA-256"
                    );


            byte[] hash =
                    digest.digest(
                            input.getBytes(
                                    StandardCharsets.UTF_8
                            )
                    );


            int value =
                    ((hash[0] & 0xFF) << 24)
                            | ((hash[1] & 0xFF) << 16)
                            | ((hash[2] & 0xFF) << 8)
                            | (hash[3] & 0xFF);


            return Math.floorMod(
                    value,
                    100
            );


        } catch (NoSuchAlgorithmException exception) {

            throw new IllegalStateException(
                    "SHA-256 algoritmasi bulunamadi.",
                    exception
            );
        }
    }


    private void validateUserKey(
            String userKey
    ) {

        if (
                userKey == null
                        || userKey.isBlank()
        ) {

            throw new IllegalArgumentException(
                    "userKey bos olamaz."
            );
        }
    }
}