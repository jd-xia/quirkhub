package com.kiddoquest.api;

import com.kiddoquest.api.dto.ChildCreateRequest;
import com.kiddoquest.api.dto.ChildResponse;
import com.kiddoquest.api.dto.ChildUpdateRequest;
import com.kiddoquest.security.Authz;
import com.kiddoquest.service.ChildService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/children")
@RequiredArgsConstructor
public class ChildrenController {
  private final ChildService childService;

  @GetMapping
  public ResponseEntity<List<ChildResponse>> list(Authentication authentication) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(childService.listByParent(p.userId()));
  }

  @PostMapping
  public ResponseEntity<ChildResponse> create(Authentication authentication, @Valid @RequestBody ChildCreateRequest req) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(childService.create(p.userId(), req));
  }

  @PutMapping("/{id}")
  public ResponseEntity<ChildResponse> update(
      Authentication authentication,
      @PathVariable("id") long id,
      @Valid @RequestBody ChildUpdateRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(childService.update(p.userId(), id, req));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    childService.delete(p.userId(), id);
    return ResponseEntity.noContent().build();
  }
}

