package com.kiddoquest.api;

import com.kiddoquest.api.dto.*;
import com.kiddoquest.security.AuthPrincipal;
import com.kiddoquest.security.Authz;
import com.kiddoquest.security.Role;
import com.kiddoquest.service.PlayTimeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/playtime")
@RequiredArgsConstructor
public class PlayTimeController {
  private final PlayTimeService playTimeService;

  @GetMapping("/{childId}")
  public ResponseEntity<PlayTimeBalanceResponse> balance(Authentication authentication, @PathVariable("childId") long childId) {
    AuthPrincipal p = Authz.requirePrincipal(authentication);
    boolean isParent = p.role() == Role.PARENT;
    return ResponseEntity.ok(playTimeService.balance(p.userId(), isParent, childId));
  }

  @GetMapping("/{childId}/summary")
  public ResponseEntity<PlayTimeSummaryResponse> summary(Authentication authentication, @PathVariable("childId") long childId) {
    AuthPrincipal p = Authz.requirePrincipal(authentication);
    boolean isParent = p.role() == Role.PARENT;
    return ResponseEntity.ok(playTimeService.summary(p.userId(), isParent, childId));
  }

  @PostMapping("/{childId}/redeem")
  public ResponseEntity<PlayTimeLogResponse> redeem(Authentication authentication, @PathVariable("childId") long childId, @Valid @RequestBody PlayTimeRedeemRequest req) {
    var c = Authz.requireChild(authentication);
    if (c.userId() != childId) throw new ForbiddenException("Cannot redeem for other child");
    return ResponseEntity.ok(playTimeService.redeemFromPoints(childId, req));
  }

  @PostMapping("/{childId}/consume")
  public ResponseEntity<PlayTimeLogResponse> consume(Authentication authentication, @PathVariable("childId") long childId, @Valid @RequestBody PlayTimeConsumeRequest req) {
    var c = Authz.requireChild(authentication);
    if (c.userId() != childId) throw new ForbiddenException("Cannot consume for other child");
    return ResponseEntity.ok(playTimeService.consume(childId, req));
  }
}

