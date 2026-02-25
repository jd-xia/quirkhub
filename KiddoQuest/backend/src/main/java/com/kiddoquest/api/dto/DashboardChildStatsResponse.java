package com.kiddoquest.api.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardChildStatsResponse(
    long childId,
    String childName,
    int pointsBalance,
    int pointsBalanceIncludingCurrentWeek,
    LocalDate weekStartDate,
    int weekTotalScore,
    List<Integer> weekDayTotals,
    DashboardCategoryTotals weekCategoryTotals,
    List<DashboardWeekTrendPoint> recentWeeks,
    DashboardPointsWindow points30d,
    List<DashboardItemTotal> allTimeItemTotals
) {}

