package com.kiddoquest.api.dto;

import jakarta.validation.constraints.NotBlank;

public record AuthLoginRequest(
    @NotBlank String account,
    @NotBlank String password
) {}

