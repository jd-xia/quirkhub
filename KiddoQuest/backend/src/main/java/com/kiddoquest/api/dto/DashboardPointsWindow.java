package com.kiddoquest.api.dto;

public record DashboardPointsWindow(
    int days,
    int earned,
    int spent,
    int net,
    int redeemCount,
    int redeemSpent
) {}

