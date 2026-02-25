package com.kiddoquest.api.dto;

import java.time.Instant;

public record ShopPurchaseResponse(
    long id,
    long childId,
    long itemId,
    String itemName,
    String itemIcon,
    int costPoints,
    int quantity,
    int totalCostPoints,
    int balanceAfter,
    boolean revoked,
    Instant createTime
) {}

