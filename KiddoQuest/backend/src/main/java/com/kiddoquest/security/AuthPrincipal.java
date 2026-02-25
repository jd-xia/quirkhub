package com.kiddoquest.security;

public record AuthPrincipal(
    long userId,
    Role role,
    String subject
) {
  public String authority() {
    return "ROLE_" + role.name();
  }
}

