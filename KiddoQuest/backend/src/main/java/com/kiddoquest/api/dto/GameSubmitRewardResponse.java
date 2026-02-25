package com.kiddoquest.api.dto;

public record GameSubmitRewardResponse(
    int awardedPoints,
    int pointsBalance,
    int playtimeBalanceMinutes
) {}

