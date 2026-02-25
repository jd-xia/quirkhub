package com.kiddoquest.api.dto;

import jakarta.validation.constraints.NotNull;

public record WeeklyScoreItemUpdateDto(
    @NotNull Long id,
    Integer score,
    String remark
) {}

