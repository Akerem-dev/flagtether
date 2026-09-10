package com.releasepilot;
public class FeatureFlagNotFoundException
        extends RuntimeException {

    // Islem yapmak istedigimiz feature flag
    // bulunamadiginda kullanilir.

    public FeatureFlagNotFoundException(
            String flagName
    ) {

        super(
                "Feature flag bulunamadi: "
                        + flagName
        );
    }
}