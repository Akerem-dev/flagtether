package com.flagtether;

public class FeatureFlagAlreadyExistsException extends RuntimeException {

  // Ayni isimde ikinci bir feature flag
  // olusturulmaya calisildiginda kullanilir.

  public FeatureFlagAlreadyExistsException(String flagName) {

    super("Feature flag zaten mevcut: " + flagName);
  }
}
