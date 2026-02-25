package com.kiddoquest.api.dto;

import com.kiddoquest.domain.PointsChangeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PointsAdjustRequest(
    @NotNull PointsChangeType changeType,
    @NotNull Integer scoreChange,
    @NotBlank String description
) {}

