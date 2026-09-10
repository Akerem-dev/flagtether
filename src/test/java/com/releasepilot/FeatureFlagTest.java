package com.releasepilot;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class FeatureFlagTest {

  @Test
  void normalizesEnvironmentAndUpdatesState() {
    FeatureFlag flag = new FeatureFlag("new_checkout", " PROD ", true, 25);

    assertThat(flag.getEnvironment()).isEqualTo("prod");
    assertThat(flag.isEnabled()).isTrue();
    assertThat(flag.getRolloutPercentage()).isEqualTo(25);

    flag.disable();
    flag.updateRolloutPercentage(60);

    assertThat(flag.isEnabled()).isFalse();
    assertThat(flag.getRolloutPercentage()).isEqualTo(60);
  }

  @Test
  void rejectsRolloutOutsideSupportedRange() {
    assertThatThrownBy(() -> new FeatureFlag("new_checkout", "prod", true, 101))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("0 ile 100");
  }

  @Test
  void rejectsUnsupportedEnvironment() {
    assertThatThrownBy(() -> new FeatureFlag("new_checkout", "production", true, 10))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("dev, staging veya prod");
  }
}
