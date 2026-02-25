package com.kiddoquest.api.dto;

import com.kiddoquest.domain.ScoreType;
import com.kiddoquest.domain.DimensionCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TemplateItemDto(
    DimensionCategory category,
    @NotBlank @Size(max = 128) String name,
    @Size(max = 512) String description,
    @NotNull Integer earningPoint,
    @NotNull ScoreType scoreType
) {}

