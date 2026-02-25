package com.kiddoquest.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TemplateCreateRequest(
    @NotBlank @Size(max = 128) String name,
    @Size(max = 512) String description,
    @NotNull Integer defaultPoint,
    @Valid @NotNull List<TemplateItemDto> items
) {}

