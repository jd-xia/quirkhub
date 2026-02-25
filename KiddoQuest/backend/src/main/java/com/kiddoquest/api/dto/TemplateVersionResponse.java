package com.kiddoquest.api.dto;

import java.time.Instant;

public record TemplateVersionResponse(
    long id,
    long templateId,
    int version,
    String snapshot,
    Instant createTime
) {}

