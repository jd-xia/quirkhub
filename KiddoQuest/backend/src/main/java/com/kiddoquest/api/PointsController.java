package com.kiddoquest.api;

import com.kiddoquest.api.dto.PointsAdjustRequest;
import com.kiddoquest.api.dto.PointsBalanceResponse;
import com.kiddoquest.api.dto.PointsLogResponse;
import com.kiddoquest.api.dto.PointsLogUpdateRequest;
import com.kiddoquest.api.dto.PointsSummaryResponse;
import com.kiddoquest.security.AuthPrincipal;
import com.kiddoquest.security.Authz;
import com.kiddoquest.security.Role;
import com.kiddoquest.service.PointsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/points")
@RequiredArgsConstructor
public class PointsController {
  private final PointsService pointsService;

  @GetMapping("/{childId}")
  public ResponseEntity<PointsBalanceResponse> balance(Authentication authentication, @PathVariable("childId") long childId) {
    AuthPrincipal p = Authz.requirePrincipal(authentication);
    boolean isParent = p.role() == Role.PARENT;
    return ResponseEntity.ok(pointsService.balance(p.userId(), isParent, childId));
  }

  @PostMapping("/{childId}/adjust")
  public ResponseEntity<PointsLogResponse> adjust(
      Authentication authentication,
      @PathVariable("childId") long childId,
      @Valid @RequestBody PointsAdjustRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(pointsService.adjust(p.userId(), childId, req));
  }

  @GetMapping("/{childId}/summary")
  public ResponseEntity<PointsSummaryResponse> summary(Authentication authentication, @PathVariable("childId") long childId) {
    AuthPrincipal p = Authz.requirePrincipal(authentication);
    boolean isParent = p.role() == Role.PARENT;
    return ResponseEntity.ok(pointsService.summary(p.userId(), isParent, childId));
  }

  @PutMapping("/{childId}/logs/{logId}")
  public ResponseEntity<PointsLogResponse> updateManualLog(
      Authentication authentication,
      @PathVariable("childId") long childId,
      @PathVariable("logId") long logId,
      @Valid @RequestBody PointsLogUpdateRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(pointsService.updateManualLog(p.userId(), childId, logId, req));
  }
}

