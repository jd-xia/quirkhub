package com.kiddoquest.api.dto;

public record PlayTimeBalanceResponse(
    long childId,
    int balanceMinutes
) {}

