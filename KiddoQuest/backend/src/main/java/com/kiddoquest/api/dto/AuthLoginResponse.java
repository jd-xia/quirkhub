package com.kiddoquest.api.dto;

import com.kiddoquest.security.Role;

public record AuthLoginResponse(
    String accessToken,
    Role role,
    long userId,
    String displayName
) {}

