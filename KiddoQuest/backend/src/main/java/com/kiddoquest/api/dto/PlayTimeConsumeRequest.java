package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PlayTimeConsumeRequest(
    @NotNull @Min(1) @Max(240) Integer minutes,
    @Size(max = 64) String game
) {}

