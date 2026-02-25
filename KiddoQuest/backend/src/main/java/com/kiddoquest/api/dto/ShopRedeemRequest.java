package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Min;

public record ShopRedeemRequest(
    @Min(1) Integer quantity
) {}

