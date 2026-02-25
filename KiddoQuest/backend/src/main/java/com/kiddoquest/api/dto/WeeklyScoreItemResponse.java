package com.kiddoquest.api.dto;

import com.kiddoquest.domain.DimensionCategory;

public record WeeklyScoreItemResponse(
    long id,
    DimensionCategory category,
    String dimensionName,
    int day,
    int score,
    int maxScore,
    String remark
) {}

