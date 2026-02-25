package com.kiddoquest.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PointsLogUpdateRequest(
    @NotNull Integer scoreChange,
    @NotBlank String description
) {}

