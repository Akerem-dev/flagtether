package com.flagtether;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class RequestParameterErrorHttpTest {

  private MockMvc mockMvc;

  @BeforeEach
  void setUp() {
    AuditLogService auditLogService = mock(AuditLogService.class);
    FeatureFlagService featureFlagService = mock(FeatureFlagService.class);
    FeatureFlagEvaluationService evaluationService = mock(FeatureFlagEvaluationService.class);
    TargetingRuleService targetingRuleService = mock(TargetingRuleService.class);

    mockMvc =
        MockMvcBuilders.standaloneSetup(
                new AuditLogController(auditLogService),
                new EnvironmentFeatureFlagController(
                    featureFlagService, evaluationService, targetingRuleService))
            .setControllerAdvice(new GlobalExceptionHandler())
            .build();
  }

  @Test
  void auditEndpointReturnsApiErrorForNonNumericLimit() throws Exception {
    mockMvc
        .perform(get("/api/audit").param("limit", "abc"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.message").value("Invalid value for request parameter: limit"));
  }

  @Test
  void evaluationEndpointReturnsApiErrorWhenUserKeyIsMissing() throws Exception {
    mockMvc
        .perform(get("/api/environments/prod/flags/checkout-v2/evaluate"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.message").value("Missing required request parameter: userKey"));
  }
}
