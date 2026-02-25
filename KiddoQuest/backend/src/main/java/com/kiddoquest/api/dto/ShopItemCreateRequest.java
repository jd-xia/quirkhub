package com.kiddoquest.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ShopItemCreateRequest(
    Long childId,
    @NotBlank @Size(max = 64) String name,
    @Size(max = 512) String description,
    @NotNull @Min(1) Integer costPoints,
    @Min(0) Integer stock,
    @Size(max = 32) String icon
) {}

