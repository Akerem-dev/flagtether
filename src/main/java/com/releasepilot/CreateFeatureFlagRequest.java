package com.releasepilot;

// =============================================================
// CREATE FEATURE FLAG REQUEST DTO
// =============================================================
//
// Bu class database entity'si degil.
//
// Bu class'in gorevi:
//
// Client'tan gelen POST request'indeki JSON verisini
// Java tarafinda temsil etmek.
//
// Ornek JSON:
//
// {
//   "name": "search_v2",
//   "enabled": false,
//   "rolloutPercentage": 10
// }
//

public class CreateFeatureFlagRequest {

  // JSON'daki:
  //
  // "name"
  //
  // degeri burada tutulacak.
  private String name;

  // JSON'daki:
  //
  // "enabled"
  //
  // degeri burada tutulacak.
  private boolean enabled;

  // JSON'daki:
  //
  // "rolloutPercentage"
  //
  // degeri burada tutulacak.
  private int rolloutPercentage;

  // =========================================================
  // BOS CONSTRUCTOR
  // =========================================================
  //
  // JSON -> Java object donusumunu yapan sistemin
  // object'i olusturabilmesi icin bos constructor
  // bulunduruyoruz.

  public CreateFeatureFlagRequest() {}

  // =========================================================
  // GETTERS
  // =========================================================

  public String getName() {

    return name;
  }

  public boolean isEnabled() {

    return enabled;
  }

  public int getRolloutPercentage() {

    return rolloutPercentage;
  }

  // =========================================================
  // SETTERS
  // =========================================================
  //
  // JSON'dan okunan degerlerin object'in field'larina
  // yerlestirilebilmesi icin setter kullaniyoruz.

  public void setName(String name) {

    this.name = name;
  }

  public void setEnabled(boolean enabled) {

    this.enabled = enabled;
  }

  public void setRolloutPercentage(int rolloutPercentage) {

    this.rolloutPercentage = rolloutPercentage;
  }
}
