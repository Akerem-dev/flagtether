package com.flagtether;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

  // HTTP GET istegi:
  //
  // /api/health
  //
  // adresine gelirse bu method calisacak.
  @GetMapping("/api/health")
  public String health() {

    return "FlagTether API is running";
  }
}
