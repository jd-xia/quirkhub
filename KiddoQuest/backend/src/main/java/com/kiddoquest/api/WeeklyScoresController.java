package com.kiddoquest.api;

import com.kiddoquest.api.dto.*;
import com.kiddoquest.security.Authz;
import com.kiddoquest.service.WeeklyScoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/weekly-scores")
@RequiredArgsConstructor
public class WeeklyScoresController {
  private final WeeklyScoreService weeklyScoreService;

  @PostMapping
  public ResponseEntity<WeeklyScoreResponse> create(Authentication authentication, @Valid @RequestBody WeeklyScoreCreateRequest req) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(weeklyScoreService.create(p.userId(), req));
  }

  @GetMapping
  public ResponseEntity<List<WeeklyScoreResponse>> list(
      Authentication authentication,
      @RequestParam("childId") long childId,
      @RequestParam(value = "week", required = false) LocalDate week
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(weeklyScoreService.list(p.userId(), childId, week));
  }

  @GetMapping("/{id}")
  public ResponseEntity<WeeklyScoreResponse> get(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(weeklyScoreService.get(p.userId(), id));
  }

  public record UpdateItemsRequest(@Valid List<WeeklyScoreItemUpdateDto> items) {}

  @PutMapping("/{id}/items")
  public ResponseEntity<WeeklyScoreResponse> updateItems(
      Authentication authentication,
      @PathVariable("id") long id,
      @Valid @RequestBody UpdateItemsRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(weeklyScoreService.updateItems(p.userId(), id, req.items()));
  }

  @PostMapping("/{id}/submit")
  public ResponseEntity<WeeklyScoreResponse> submit(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(weeklyScoreService.submit(p.userId(), id));
  }

  @PostMapping("/{id}/revoke")
  public ResponseEntity<WeeklyScoreResponse> revoke(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(weeklyScoreService.revoke(p.userId(), id));
  }
}

