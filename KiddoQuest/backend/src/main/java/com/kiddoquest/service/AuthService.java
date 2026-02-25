package com.kiddoquest.service;

import com.kiddoquest.api.dto.AuthLoginRequest;
import com.kiddoquest.api.dto.AuthLoginResponse;
import com.kiddoquest.domain.Child;
import com.kiddoquest.domain.Parent;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.ParentRepository;
import com.kiddoquest.security.AuthPrincipal;
import com.kiddoquest.security.JwtService;
import com.kiddoquest.security.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final ParentRepository parentRepository;
  private final ChildRepository childRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;

  public AuthLoginResponse login(AuthLoginRequest req) {
    String account = req.account().trim();

    Parent parent = parentRepository.findByLoginAccount(account).orElse(null);
    if (parent != null && passwordEncoder.matches(req.password(), parent.getPasswordHash())) {
      AuthPrincipal principal = new AuthPrincipal(parent.getId(), Role.PARENT, "parent:" + parent.getId());
      return new AuthLoginResponse(
          jwtService.issueAccessToken(principal),
          principal.role(),
          principal.userId(),
          parent.getDisplayName()
      );
    }

    Child child = childRepository.findByLoginAccount(account).orElse(null);
    if (child != null && passwordEncoder.matches(req.password(), child.getPasswordHash())) {
      AuthPrincipal principal = new AuthPrincipal(child.getId(), Role.CHILD, "child:" + child.getId());
      return new AuthLoginResponse(
          jwtService.issueAccessToken(principal),
          principal.role(),
          principal.userId(),
          child.getName()
      );
    }

    throw new IllegalArgumentException("Invalid account or password");
  }
}

