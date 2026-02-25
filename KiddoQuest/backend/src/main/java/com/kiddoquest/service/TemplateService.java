package com.kiddoquest.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.*;
import com.kiddoquest.domain.*;
import com.kiddoquest.repo.TemplateItemRepository;
import com.kiddoquest.repo.TemplateRepository;
import com.kiddoquest.repo.TemplateVersionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {
  private final TemplateRepository templateRepository;
  private final TemplateVersionRepository templateVersionRepository;
  private final TemplateItemRepository templateItemRepository;
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Transactional(readOnly = true)
  public List<TemplateResponse> list(long parentId) {
    return templateRepository.findAllByCreatedByAndStatus(parentId, TemplateStatus.ACTIVE).stream()
        .map(this::toResponse)
        .toList();
  }

  @Transactional
  public TemplateResponse create(long parentId, TemplateCreateRequest req) {
    Instant now = Instant.now();
    Template t = Template.builder()
        .name(req.name().trim())
        .description(req.description())
        .defaultPoint(req.defaultPoint())
        .version(1)
        .status(TemplateStatus.ACTIVE)
        .createdBy(parentId)
        .createTime(now)
        .updateTime(now)
        .build();
    templateRepository.save(t);

    createVersionWithItems(t, 1, req.items(), now);
    return toResponse(t);
  }

  @Transactional
  public TemplateResponse update(long parentId, long templateId, TemplateUpdateRequest req) {
    Template t = templateRepository.findByIdAndCreatedBy(templateId, parentId)
        .orElseThrow(() -> new ForbiddenException("Template not found"));
    if (t.getStatus() == TemplateStatus.DELETED) {
      throw new IllegalArgumentException("Template is deleted");
    }

    int currentVersion = t.getVersion();

    if (req.name() != null) t.setName(req.name().trim());
    if (req.description() != null) t.setDescription(req.description());
    if (req.defaultPoint() != null) t.setDefaultPoint(req.defaultPoint());

    int newVersion = t.getVersion() + 1;
    t.setVersion(newVersion);
    t.setUpdateTime(Instant.now());

    List<TemplateItemDto> items = req.items();
    if (items == null) {
      TemplateVersion tv = templateVersionRepository.findByTemplate_IdAndVersion(t.getId(), currentVersion)
          .orElseThrow(() -> new IllegalArgumentException("Current template version not found"));
      items = templateItemRepository.findAllByTemplateVersion_Id(tv.getId()).stream()
          .map(i -> new TemplateItemDto(i.getCategory(), i.getName(), i.getDescription(), i.getEarningPoint(), i.getScoreType()))
          .toList();
    }

    createVersionWithItems(t, newVersion, items, t.getUpdateTime());
    return toResponse(t);
  }

  @Transactional
  public void delete(long parentId, long templateId) {
    Template t = templateRepository.findByIdAndCreatedBy(templateId, parentId)
        .orElseThrow(() -> new ForbiddenException("Template not found"));
    t.setStatus(TemplateStatus.DELETED);
    t.setUpdateTime(Instant.now());
  }

  @Transactional
  public void restore(long parentId, long templateId) {
    Template t = templateRepository.findByIdAndCreatedBy(templateId, parentId)
        .orElseThrow(() -> new ForbiddenException("Template not found"));
    t.setStatus(TemplateStatus.ACTIVE);
    t.setUpdateTime(Instant.now());
  }

  @Transactional(readOnly = true)
  public List<TemplateVersionResponse> versions(long parentId, long templateId) {
    Template t = templateRepository.findByIdAndCreatedBy(templateId, parentId)
        .orElseThrow(() -> new ForbiddenException("Template not found"));
    return templateVersionRepository.findAllByTemplate_IdOrderByVersionDesc(t.getId()).stream()
        .map(v -> new TemplateVersionResponse(v.getId(), t.getId(), v.getVersion(), v.getSnapshot(), v.getCreateTime()))
        .toList();
  }

  @Transactional
  public TemplateResponse rollback(long parentId, long templateId, int toVersion) {
    Template t = templateRepository.findByIdAndCreatedBy(templateId, parentId)
        .orElseThrow(() -> new ForbiddenException("Template not found"));

    TemplateVersion tv = templateVersionRepository.findByTemplate_IdAndVersion(t.getId(), toVersion)
        .orElseThrow(() -> new IllegalArgumentException("Target version not found"));

    TemplateSnapshot snapshot = readSnapshot(tv.getSnapshot());

    if (snapshot.name() != null) t.setName(snapshot.name());
    t.setDescription(snapshot.description());
    t.setDefaultPoint(snapshot.defaultPoint());

    int newVersion = t.getVersion() + 1;
    t.setVersion(newVersion);
    t.setUpdateTime(Instant.now());

    createVersionWithItems(t, newVersion, snapshot.items(), t.getUpdateTime());
    return toResponse(t);
  }

  private void createVersionWithItems(Template template, int version, List<TemplateItemDto> items, Instant now) {
    if (items == null || items.isEmpty()) {
      throw new IllegalArgumentException("items is required");
    }

    TemplateSnapshot snapshot = new TemplateSnapshot(
        template.getName(),
        template.getDescription(),
        template.getDefaultPoint(),
        items
    );

    String json;
    try {
      json = objectMapper.writeValueAsString(snapshot);
    } catch (JsonProcessingException e) {
      throw new IllegalArgumentException("Failed to serialize template snapshot");
    }

    TemplateVersion tv = TemplateVersion.builder()
        .template(template)
        .version(version)
        .snapshot(json)
        .createTime(now)
        .build();
    templateVersionRepository.save(tv);

    for (TemplateItemDto dto : items) {
      TemplateItem item = TemplateItem.builder()
          .templateVersion(tv)
          .name(dto.name().trim())
          .category(dto.category() == null ? DimensionCategory.LIFE : dto.category())
          .description(dto.description())
          .earningPoint(dto.earningPoint())
          .scoreType(dto.scoreType())
          .build();
      templateItemRepository.save(item);
    }
  }

  private TemplateSnapshot readSnapshot(String json) {
    try {
      return objectMapper.readValue(json, TemplateSnapshot.class);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid template snapshot");
    }
  }

  private TemplateResponse toResponse(Template t) {
    return new TemplateResponse(
        t.getId(),
        t.getName(),
        t.getDescription(),
        t.getDefaultPoint(),
        t.getVersion(),
        t.getStatus(),
        t.getCreateTime(),
        t.getUpdateTime()
    );
  }

  // Snapshot schema stored in template_version.snapshot
  public record TemplateSnapshot(
      String name,
      String description,
      int defaultPoint,
      List<TemplateItemDto> items
  ) {}
}

