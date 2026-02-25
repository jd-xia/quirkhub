package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Size;

public record ChildUpdateRequest(
    @Size(max = 64) String name,
    @Size(max = 72) String password,
    String avatar
) {}

