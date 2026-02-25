package com.kiddoquest.api.dto;

import com.kiddoquest.security.Role;

public record AuthMeResponse(
    long userId,
    Role role,
    String subject
) {}

