package com.kiddoquest.api.dto;

import com.kiddoquest.domain.PlayTimeChangeType;

import java.time.Instant;

public record PlayTimeLogResponse(
    long id,
    PlayTimeChangeType changeType,
    int minutesChange,
    int balanceMinutes,
    String description,
    Long relatedId,
    Instant createTime
) {}

