package com.kiddoquest.api.dto;

import com.kiddoquest.domain.WeeklyScoreStatus;

import java.time.LocalDate;

public record DashboardWeekTrendPoint(
    LocalDate weekStartDate,
    int totalScore,
    WeeklyScoreStatus status
) {}

