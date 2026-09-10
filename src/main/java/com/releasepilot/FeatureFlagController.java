package com.releasepilot;

import java.util.List;
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

@RestController
@RequestMapping("/api/flags")
public class FeatureFlagController {

  private final FeatureFlagService featureFlagService;

  private final FeatureFlagEvaluationService evaluationService;

  public FeatureFlagController(
      FeatureFlagService featureFlagService, FeatureFlagEvaluationService evaluationService) {

    this.featureFlagService = featureFlagService;

    this.evaluationService = evaluationService;
  }

  @GetMapping
  public List<FeatureFlag> getAllFlags() {

    return featureFlagService.getAllFlags();
  }

  @GetMapping("/{name}")
  public FeatureFlag getFlagByName(@PathVariable String name) {

    return featureFlagService.getFlagByName(name);
  }

  @PostMapping
  public ResponseEntity<FeatureFlag> createFlag(@RequestBody CreateFeatureFlagRequest request) {

    FeatureFlag createdFlag =
        featureFlagService.createFlag(
            request.getName(), request.isEnabled(), request.getRolloutPercentage());

    return ResponseEntity.status(HttpStatus.CREATED).body(createdFlag);
  }

  @PatchMapping("/{name}/enabled")
  public FeatureFlag updateEnabled(
      @PathVariable String name, @RequestBody UpdateFeatureFlagEnabledRequest request) {

    return featureFlagService.updateEnabled(name, request.isEnabled());
  }

  @PatchMapping("/{name}/rollout")
  public FeatureFlag updateRollout(
      @PathVariable String name, @RequestBody UpdateFeatureFlagRolloutRequest request) {

    return featureFlagService.updateRollout(name, request.getRolloutPercentage());
  }

  @DeleteMapping("/{name}")
  public ResponseEntity<Void> deleteFlag(@PathVariable String name) {

    featureFlagService.deleteFlag(name);

    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{name}/evaluate")
  public FeatureFlagEvaluation evaluateFlag(
      @PathVariable String name, @RequestParam String userKey) {

    return evaluationService.evaluate(name, userKey);
  }
}
