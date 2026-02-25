package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record GameDictationSubmitRequest(
    @NotNull @Min(1) @Max(240) Integer minutesUsed,
    @NotNull @Min(1) @Max(100) Integer total,
    @NotNull @Min(0) @Max(100) Integer correct
) {}

