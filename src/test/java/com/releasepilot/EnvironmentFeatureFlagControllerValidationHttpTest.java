package com.releasepilot;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class EnvironmentFeatureFlagControllerValidationHttpTest {

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
    FeatureFlagEvaluationService evaluationService = mock(FeatureFlagEvaluationService.class);
    TargetingRuleService targetingRuleService = mock(TargetingRuleService.class);

    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();

    mockMvc =
        MockMvcBuilders.standaloneSetup(
                new EnvironmentFeatureFlagController(
                    featureFlagService, evaluationService, targetingRuleService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setValidator(validator)
            .build();
  }

  @Test
  void createEndpointRejectsMissingRequiredFields() throws Exception {
    mockMvc
        .perform(
            post("/api/environments/prod/flags")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void enabledEndpointRejectsMissingValue() throws Exception {
    mockMvc
        .perform(
            patch("/api/environments/prod/flags/checkout-v2/enabled")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void rolloutEndpointRejectsMissingValue() throws Exception {
    mockMvc
        .perform(
            patch("/api/environments/prod/flags/checkout-v2/rollout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void targetingRuleEndpointRejectsMissingPriority() throws Exception {
    mockMvc
        .perform(
            post("/api/environments/prod/flags/checkout-v2/rules")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {
                      "attribute": "country",
                      "operator": "EQUALS",
                      "comparisonValue": "TR",
                      "serveEnabled": true
                    }
                    """))
        .andExpect(status().isBadRequest());
  }
}
