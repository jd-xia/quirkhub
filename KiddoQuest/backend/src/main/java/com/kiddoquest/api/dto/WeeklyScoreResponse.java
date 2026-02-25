package com.kiddoquest.api.dto;

import com.kiddoquest.domain.WeeklyScoreStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record WeeklyScoreResponse(
    long id,
    long templateVersionId,
    long childId,
    LocalDate weekStartDate,
    LocalDate weekEndDate,
    WeeklyScoreStatus status,
    int totalScore,
    Instant createTime,
    List<WeeklyScoreItemResponse> items
) {}

