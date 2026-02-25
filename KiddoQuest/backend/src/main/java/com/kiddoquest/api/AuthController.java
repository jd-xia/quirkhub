package com.kiddoquest.api;

import com.kiddoquest.api.dto.AuthLoginRequest;
import com.kiddoquest.api.dto.AuthLoginResponse;
import com.kiddoquest.api.dto.AuthMeResponse;
import com.kiddoquest.security.AuthPrincipal;
import com.kiddoquest.security.Authz;
import com.kiddoquest.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
  private final AuthService authService;

  @PostMapping("/login")
  public ResponseEntity<AuthLoginResponse> login(@Valid @RequestBody AuthLoginRequest req) {
    return ResponseEntity.ok(authService.login(req));
  }

  @GetMapping("/me")
  public ResponseEntity<AuthMeResponse> me(Authentication authentication) {
    AuthPrincipal principal = Authz.requirePrincipal(authentication);
    return ResponseEntity.ok(new AuthMeResponse(principal.userId(), principal.role(), principal.subject()));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    // JWT is stateless; client should discard token. (Blacklist/refresh tokens can be added later.)
    return ResponseEntity.noContent().build();
  }
}

