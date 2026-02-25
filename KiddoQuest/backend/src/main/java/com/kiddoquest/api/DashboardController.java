package com.kiddoquest.api;

import com.kiddoquest.api.dto.DashboardChildResponse;
import com.kiddoquest.api.dto.DashboardFamilyResponse;
import com.kiddoquest.api.dto.DashboardFamilyV2Response;
import com.kiddoquest.security.Authz;
import com.kiddoquest.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
  private final DashboardService dashboardService;

  @GetMapping("/family")
  public ResponseEntity<DashboardFamilyResponse> family(Authentication authentication) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(dashboardService.family(p.userId()));
  }

  @GetMapping("/family-v2")
  public ResponseEntity<DashboardFamilyV2Response> familyV2(Authentication authentication) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(dashboardService.familyV2(p.userId()));
  }

  @GetMapping("/child/{id}")
  public ResponseEntity<DashboardChildResponse> child(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(dashboardService.child(p.userId(), id));
  }
}

