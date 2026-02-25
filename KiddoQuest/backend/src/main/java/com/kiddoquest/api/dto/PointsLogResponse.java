package com.kiddoquest.api.dto;

import com.kiddoquest.domain.PointsChangeType;

import java.time.Instant;

public record PointsLogResponse(
    long id,
    PointsChangeType changeType,
    int scoreChange,
    int balance,
    String description,
    Long relatedId,
    Instant createTime
) {}

