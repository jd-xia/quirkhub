package com.kiddoquest.api.dto;

import java.util.List;

public record PlayTimeSummaryResponse(
    long childId,
    int balanceMinutes,
    List<PlayTimeLogResponse> recentLogs
) {}

