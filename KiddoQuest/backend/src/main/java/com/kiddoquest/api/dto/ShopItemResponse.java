package com.kiddoquest.api.dto;

import com.kiddoquest.domain.ShopItemStatus;

import java.time.Instant;

public record ShopItemResponse(
    long id,
    Long childId,
    String name,
    String description,
    int costPoints,
    Integer stock,
    String icon,
    ShopItemStatus status,
    Instant createTime,
    Instant updateTime
) {}

