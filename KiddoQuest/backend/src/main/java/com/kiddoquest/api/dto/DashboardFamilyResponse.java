package com.kiddoquest.api.dto;

import java.util.List;

public record DashboardFamilyResponse(
    List<DashboardChildResponse> children
) {}

