package com.kiddoquest.api.dto;

import java.time.Instant;

public record ChildResponse(
    long id,
    String name,
    String loginAccount,
    String avatar,
    long parentId,
    Instant createTime
) {}

