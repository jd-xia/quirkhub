package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GameEssaySubmitRequest(
    @NotNull @Min(1) @Max(240) Integer minutesUsed,
    @NotBlank @Size(max = 64) String promptTitle,
    @NotBlank @Size(max = 4000) String content
) {}

