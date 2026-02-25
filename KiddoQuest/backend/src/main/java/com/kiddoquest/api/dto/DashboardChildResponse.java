package com.kiddoquest.api.dto;

import java.time.LocalDate;

public record DashboardChildResponse(
    long childId,
    String childName,
    int pointsBalance,
    int pointsBalanceIncludingCurrentWeek,
    LocalDate weekStartDate,
    int weekTotalScore
) {}

