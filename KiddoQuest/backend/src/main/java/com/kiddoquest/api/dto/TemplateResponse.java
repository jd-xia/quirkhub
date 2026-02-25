package com.kiddoquest.api.dto;

import com.kiddoquest.domain.TemplateStatus;

import java.time.Instant;

public record TemplateResponse(
    long id,
    String name,
    String description,
    int defaultPoint,
    int version,
    TemplateStatus status,
    Instant createTime,
    Instant updateTime
) {}

