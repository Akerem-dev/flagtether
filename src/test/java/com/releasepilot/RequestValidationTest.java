package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import java.util.Set;
import org.junit.jupiter.api.Test;

class RequestValidationTest {

  private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

  @Test
  void rejectsMissingFeatureFlagFields() {
    CreateFeatureFlagRequest request = new CreateFeatureFlagRequest();

    assertThat(fields(validator.validate(request)))
        .containsExactlyInAnyOrder("name", "enabled", "rolloutPercentage");
  }

  @Test
  void rejectsOutOfRangeFeatureFlagRollout() {
    CreateFeatureFlagRequest request = new CreateFeatureFlagRequest();
    request.setName("checkout-v2");
    request.setEnabled(true);
    request.setRolloutPercentage(101);

    assertThat(fields(validator.validate(request))).containsExactly("rolloutPercentage");
  }

  @Test
  void requiresExplicitEnabledPatchValue() {
    UpdateFeatureFlagEnabledRequest request = new UpdateFeatureFlagEnabledRequest();

    assertThat(fields(validator.validate(request))).containsExactly("enabled");
  }

  @Test
  void validatesRolloutPatchRange() {
    UpdateFeatureFlagRolloutRequest request = new UpdateFeatureFlagRolloutRequest();
    request.setRolloutPercentage(-1);

    assertThat(fields(validator.validate(request))).containsExactly("rolloutPercentage");
  }

  @Test
  void validatesTargetingRuleRequiredFieldsAndPriority() {
    CreateTargetingRuleRequest missingFields = new CreateTargetingRuleRequest();

    assertThat(fields(validator.validate(missingFields)))
        .containsExactlyInAnyOrder("attribute", "operator", "comparisonValue", "serveEnabled");

    CreateTargetingRuleRequest negativePriority = new CreateTargetingRuleRequest();
    negativePriority.setAttribute("country");
    negativePriority.setOperator("EQUALS");
    negativePriority.setComparisonValue("TR");
    negativePriority.setServeEnabled(true);
    negativePriority.setPriority(-1);

    assertThat(fields(validator.validate(negativePriority))).containsExactly("priority");
  }

  private Set<String> fields(Set<? extends ConstraintViolation<?>> violations) {
    return violations.stream()
        .map(violation -> violation.getPropertyPath().toString())
        .collect(java.util.stream.Collectors.toSet());
  }
}
