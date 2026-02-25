package com.kiddoquest.security;

import com.kiddoquest.api.ForbiddenException;
import org.springframework.security.core.Authentication;

public final class Authz {
  private Authz() {}

  public static AuthPrincipal requirePrincipal(Authentication authentication) {
    if (authentication == null || !(authentication.getPrincipal() instanceof AuthPrincipal p)) {
      throw new ForbiddenException("Not authenticated");
    }
    return p;
  }

  public static AuthPrincipal requireParent(Authentication authentication) {
    AuthPrincipal p = requirePrincipal(authentication);
    if (p.role() != Role.PARENT) {
      throw new ForbiddenException("Parent role required");
    }
    return p;
  }

  public static AuthPrincipal requireChild(Authentication authentication) {
    AuthPrincipal p = requirePrincipal(authentication);
    if (p.role() != Role.CHILD) {
      throw new ForbiddenException("Child role required");
    }
    return p;
  }
}

