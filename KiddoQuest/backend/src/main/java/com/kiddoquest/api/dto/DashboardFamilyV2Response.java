package com.kiddoquest.api.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardFamilyV2Response(
    LocalDate weekStartDate,
    List<DashboardChildStatsResponse> children
) {}

