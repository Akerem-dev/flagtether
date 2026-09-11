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

class FeatureFlagControllerValidationHttpTest {

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
    FeatureFlagEvaluationService evaluationService = mock(FeatureFlagEvaluationService.class);

    LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
    validator.afterPropertiesSet();

    mockMvc =
        MockMvcBuilders.standaloneSetup(
                new FeatureFlagController(featureFlagService, evaluationService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .setValidator(validator)
            .build();
  }

  @Test
  void legacyCreateEndpointRejectsMissingRequiredFields() throws Exception {
    mockMvc
        .perform(post("/api/flags").contentType(MediaType.APPLICATION_JSON).content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void legacyEnabledEndpointRejectsMissingValue() throws Exception {
    mockMvc
        .perform(
            patch("/api/flags/checkout-v2/enabled")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void legacyRolloutEndpointRejectsMissingValue() throws Exception {
    mockMvc
        .perform(
            patch("/api/flags/checkout-v2/rollout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
        .andExpect(status().isBadRequest());
  }
}
