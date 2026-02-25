package com.kiddoquest.api.dto;

import com.kiddoquest.domain.DimensionCategory;

public record DashboardItemTotal(
    DimensionCategory category,
    String dimensionName,
    int totalScore
) {}

