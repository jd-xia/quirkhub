package com.kiddoquest.api;

import com.kiddoquest.api.dto.*;
import com.kiddoquest.security.Authz;
import com.kiddoquest.service.TemplateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/templates")
@RequiredArgsConstructor
public class TemplatesController {
  private final TemplateService templateService;

  @GetMapping
  public ResponseEntity<List<TemplateResponse>> list(Authentication authentication) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(templateService.list(p.userId()));
  }

  @PostMapping
  public ResponseEntity<TemplateResponse> create(Authentication authentication, @Valid @RequestBody TemplateCreateRequest req) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(templateService.create(p.userId(), req));
  }

  @PutMapping("/{id}")
  public ResponseEntity<TemplateResponse> update(
      Authentication authentication,
      @PathVariable("id") long id,
      @Valid @RequestBody TemplateUpdateRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(templateService.update(p.userId(), id, req));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    templateService.delete(p.userId(), id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{id}/restore")
  public ResponseEntity<Void> restore(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    templateService.restore(p.userId(), id);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/{id}/versions")
  public ResponseEntity<List<TemplateVersionResponse>> versions(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(templateService.versions(p.userId(), id));
  }

  public record RollbackRequest(int version) {}

  @PostMapping("/{id}/rollback")
  public ResponseEntity<TemplateResponse> rollback(
      Authentication authentication,
      @PathVariable("id") long id,
      @RequestBody RollbackRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(templateService.rollback(p.userId(), id, req.version()));
  }
}

