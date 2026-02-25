package com.kiddoquest.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

import java.util.List;

public record TemplateUpdateRequest(
    @Size(max = 128) String name,
    @Size(max = 512) String description,
    Integer defaultPoint,
    @Valid List<TemplateItemDto> items
) {}

