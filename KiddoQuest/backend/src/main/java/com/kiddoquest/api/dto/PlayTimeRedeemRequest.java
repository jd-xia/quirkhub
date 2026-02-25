package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PlayTimeRedeemRequest(
    @NotNull @Min(5) @Max(240) Integer minutes
) {}

