package com.kiddoquest.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChildCreateRequest(
    @NotBlank @Size(max = 64) String name,
    @NotBlank @Size(max = 64) String loginAccount,
    @NotBlank @Size(min = 6, max = 72) String password,
    String avatar
) {}

