package com.releasepilot;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;


@RestController
@RequestMapping(
        "/api/environments/{environment}/flags"
)
public class EnvironmentFeatureFlagController {

    private final FeatureFlagService featureFlagService;

    private final FeatureFlagEvaluationService evaluationService;

    private final TargetingRuleService targetingRuleService;


    public EnvironmentFeatureFlagController(
            FeatureFlagService featureFlagService,
            FeatureFlagEvaluationService evaluationService,
            TargetingRuleService targetingRuleService
    ) {

        this.featureFlagService =
                featureFlagService;

        this.evaluationService =
                evaluationService;

        this.targetingRuleService =
                targetingRuleService;
    }


    @GetMapping
    public List<FeatureFlag> getAllFlags(
            @PathVariable String environment
    ) {

        return featureFlagService.getAllFlags(
                environment
        );
    }


    @GetMapping("/{name}")
    public FeatureFlag getFlag(
            @PathVariable String environment,
            @PathVariable String name
    ) {

        return featureFlagService.getFlagByName(
                name,
                environment
        );
    }


    @PostMapping
    public ResponseEntity<FeatureFlag> createFlag(
            @PathVariable String environment,
            @RequestBody CreateFeatureFlagRequest request
    ) {

        FeatureFlag createdFlag =
                featureFlagService.createFlag(
                        request.getName(),
                        environment,
                        request.isEnabled(),
                        request.getRolloutPercentage()
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdFlag);
    }


    @PatchMapping("/{name}/enabled")
    public FeatureFlag updateEnabled(
            @PathVariable String environment,
            @PathVariable String name,
            @RequestBody UpdateFeatureFlagEnabledRequest request
    ) {

        return featureFlagService.updateEnabled(
                name,
                environment,
                request.isEnabled()
        );
    }


    @PatchMapping("/{name}/rollout")
    public FeatureFlag updateRollout(
            @PathVariable String environment,
            @PathVariable String name,
            @RequestBody UpdateFeatureFlagRolloutRequest request
    ) {

        return featureFlagService.updateRollout(
                name,
                environment,
                request.getRolloutPercentage()
        );
    }


    @DeleteMapping("/{name}")
    public ResponseEntity<Void> deleteFlag(
            @PathVariable String environment,
            @PathVariable String name
    ) {

        featureFlagService.deleteFlag(
                name,
                environment
        );


        return ResponseEntity
                .noContent()
                .build();
    }


    @GetMapping("/{name}/evaluate")
    public FeatureFlagEvaluation evaluateFlag(
            @PathVariable String environment,
            @PathVariable String name,
            @RequestParam String userKey,

            @RequestParam(
                    required = false
            )
            String country,

            @RequestParam(
                    required = false
            )
            String plan,

            @RequestParam(
                    required = false
            )
            String email
    ) {

        return evaluationService.evaluate(
                name,
                environment,
                userKey,
                country,
                plan,
                email
        );
    }


    @GetMapping("/{name}/rules")
    public List<TargetingRule> getRules(
            @PathVariable String environment,
            @PathVariable String name
    ) {

        return targetingRuleService.getRules(
                name,
                environment
        );
    }


    @PostMapping("/{name}/rules")
    public ResponseEntity<TargetingRule> createRule(
            @PathVariable String environment,
            @PathVariable String name,
            @RequestBody CreateTargetingRuleRequest request
    ) {

        TargetingRule createdRule =
                targetingRuleService.create(
                        name,
                        environment,
                        request.getAttribute(),
                        request.getOperator(),
                        request.getComparisonValue(),
                        request.isServeEnabled(),
                        request.getPriority()
                );


        return ResponseEntity
                .status(
                        HttpStatus.CREATED
                )
                .body(
                        createdRule
                );
    }


    @DeleteMapping("/{name}/rules/{ruleId}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable String environment,
            @PathVariable String name,
            @PathVariable long ruleId
    ) {

        targetingRuleService.delete(
                ruleId,
                name,
                environment
        );


        return ResponseEntity
                .noContent()
                .build();
    }
}