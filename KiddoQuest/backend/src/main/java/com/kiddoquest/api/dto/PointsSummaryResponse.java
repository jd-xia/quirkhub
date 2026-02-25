package com.kiddoquest.api.dto;

import java.util.List;

public record PointsSummaryResponse(
    long childId,
    int balance,
    List<PointsLogResponse> recentLogs
) {}

