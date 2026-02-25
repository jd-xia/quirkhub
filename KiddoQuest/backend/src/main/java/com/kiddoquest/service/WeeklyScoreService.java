package com.kiddoquest.service;

import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.WeeklyScoreCreateRequest;
import com.kiddoquest.api.dto.WeeklyScoreItemResponse;
import com.kiddoquest.api.dto.WeeklyScoreItemUpdateDto;
import com.kiddoquest.api.dto.WeeklyScoreResponse;
import com.kiddoquest.domain.*;
import com.kiddoquest.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class WeeklyScoreService {
  private final WeeklyScoreRepository weeklyScoreRepository;
  private final WeeklyScoreItemRepository weeklyScoreItemRepository;
  private final TemplateVersionRepository templateVersionRepository;
  private final TemplateItemRepository templateItemRepository;
  private final ChildRepository childRepository;
  private final TemplateRepository templateRepository;
  private final PointsService pointsService;

  @Transactional
  public WeeklyScoreResponse create(long parentId, WeeklyScoreCreateRequest req) {
    TemplateVersion tv = templateVersionRepository.findById(req.templateVersionId())
        .orElseThrow(() -> new IllegalArgumentException("TemplateVersion not found"));
    Template template = templateRepository.findById(tv.getTemplate().getId())
        .orElseThrow(() -> new IllegalArgumentException("Template not found"));
    if (template.getCreatedBy() != parentId) {
      throw new ForbiddenException("Template not owned by parent");
    }

    Child child = childRepository.findByIdAndParent_Id(req.childId(), parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));

    LocalDate start = req.weekStartDate();
    LocalDate end = start.plusDays(6);

    weeklyScoreRepository.findByChild_IdAndWeekStartDate(child.getId(), start).ifPresent(ws -> {
      throw new IllegalArgumentException("Weekly score already exists for this child and weekStartDate");
    });

    WeeklyScore ws = WeeklyScore.builder()
        .templateVersion(tv)
        .child(child)
        .weekStartDate(start)
        .weekEndDate(end)
        .status(WeeklyScoreStatus.DRAFT)
        .totalScore(0)
        .createTime(Instant.now())
        .build();
    weeklyScoreRepository.save(ws);

    List<TemplateItem> dims = templateItemRepository.findAllByTemplateVersion_Id(tv.getId());
    if (dims.isEmpty()) {
      throw new IllegalArgumentException("TemplateVersion has no items");
    }

    int maxScore = Optional.ofNullable(template.getDefaultPoint()).orElse(0);
    for (TemplateItem dim : dims) {
      for (int day = 1; day <= 7; day++) {
        int itemMax = dim.getEarningPoint() == null ? maxScore : Math.abs(dim.getEarningPoint());
        WeeklyScoreItem item = WeeklyScoreItem.builder()
            .weeklyScore(ws)
            .dimensionName(dim.getName())
            .dimensionCategory(dim.getCategory() == null ? DimensionCategory.LIFE : dim.getCategory())
            .dayOfWeek(day)
            .score(0)
            .maxScore(itemMax)
            .remark(null)
            .build();
        weeklyScoreItemRepository.save(item);
      }
    }

    return get(parentId, ws.getId());
  }

  @Transactional(readOnly = true)
  public List<WeeklyScoreResponse> list(long parentId, long childId, LocalDate weekStartDate) {
    Child child = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));
    var list = (weekStartDate == null)
        ? weeklyScoreRepository.findAllByChild_Id(child.getId())
        : weeklyScoreRepository.findAllByChild_IdAndWeekStartDate(child.getId(), weekStartDate);
    return list.stream().map(ws -> toResponse(ws, weeklyScoreItemRepository.findAllByWeeklyScore_IdOrderByDimensionNameAscDayOfWeekAsc(ws.getId()))).toList();
  }

  @Transactional(readOnly = true)
  public WeeklyScoreResponse get(long parentId, long weeklyScoreId) {
    WeeklyScore ws = weeklyScoreRepository.findById(weeklyScoreId)
        .orElseThrow(() -> new IllegalArgumentException("Weekly score not found"));
    if (ws.getChild().getParent().getId() != parentId) {
      throw new ForbiddenException("Weekly score not accessible");
    }
    var items = weeklyScoreItemRepository.findAllByWeeklyScore_IdOrderByDimensionNameAscDayOfWeekAsc(ws.getId());
    return toResponse(ws, items);
  }

  @Transactional
  public WeeklyScoreResponse updateItems(long parentId, long weeklyScoreId, List<WeeklyScoreItemUpdateDto> updates) {
    WeeklyScore ws = weeklyScoreRepository.findById(weeklyScoreId)
        .orElseThrow(() -> new IllegalArgumentException("Weekly score not found"));
    if (ws.getChild().getParent().getId() != parentId) {
      throw new ForbiddenException("Weekly score not accessible");
    }
    if (ws.getStatus() == WeeklyScoreStatus.SUBMITTED || ws.getStatus() == WeeklyScoreStatus.LOCKED) {
      throw new IllegalArgumentException("Weekly score is not editable");
    }
    if (updates == null || updates.isEmpty()) {
      throw new IllegalArgumentException("updates is required");
    }

    List<WeeklyScoreItem> items = weeklyScoreItemRepository.findAllByWeeklyScore_Id(ws.getId());
    Map<Long, WeeklyScoreItem> byId = items.stream().collect(java.util.stream.Collectors.toMap(WeeklyScoreItem::getId, Function.identity()));

    for (WeeklyScoreItemUpdateDto u : updates) {
      WeeklyScoreItem item = byId.get(u.id());
      if (item == null) {
        throw new IllegalArgumentException("Invalid item id: " + u.id());
      }
      if (u.score() != null) {
        int s = u.score();
        if (item.getDimensionCategory() == DimensionCategory.PENALTY) {
          if (s > 0) s = 0;
          if (s < -item.getMaxScore()) s = -item.getMaxScore();
        } else {
          if (s < 0) s = 0;
          if (s > item.getMaxScore()) s = item.getMaxScore();
        }
        item.setScore(s);
      }
      if (u.remark() != null) {
        item.setRemark(u.remark());
      }
    }

    int total = items.stream().mapToInt(WeeklyScoreItem::getScore).sum();
    ws.setTotalScore(total);
    if (ws.getStatus() == WeeklyScoreStatus.DRAFT) {
      ws.setStatus(WeeklyScoreStatus.ACTIVE);
    }

    return toResponse(ws, weeklyScoreItemRepository.findAllByWeeklyScore_IdOrderByDimensionNameAscDayOfWeekAsc(ws.getId()));
  }

  @Transactional
  public WeeklyScoreResponse submit(long parentId, long weeklyScoreId) {
    WeeklyScore ws = weeklyScoreRepository.findById(weeklyScoreId)
        .orElseThrow(() -> new IllegalArgumentException("Weekly score not found"));
    if (ws.getChild().getParent().getId() != parentId) {
      throw new ForbiddenException("Weekly score not accessible");
    }
    if (ws.getStatus() == WeeklyScoreStatus.LOCKED) {
      throw new IllegalArgumentException("Weekly score is locked");
    }
    if (ws.getStatus() == WeeklyScoreStatus.SUBMITTED) {
      return get(parentId, weeklyScoreId);
    }

    List<WeeklyScoreItem> items = weeklyScoreItemRepository.findAllByWeeklyScore_Id(ws.getId());
    int total = items.stream().mapToInt(WeeklyScoreItem::getScore).sum();
    ws.setTotalScore(total);
    ws.setStatus(WeeklyScoreStatus.SUBMITTED);

    // Simple settlement strategy: points = totalScore
    pointsService.settleWeeklyScore(
        parentId,
        ws.getChild().getId(),
        ws.getId(),
        total,
        "Weekly score settlement: " + ws.getWeekStartDate()
    );

    return toResponse(ws, weeklyScoreItemRepository.findAllByWeeklyScore_IdOrderByDimensionNameAscDayOfWeekAsc(ws.getId()));
  }

  @Transactional
  public WeeklyScoreResponse revoke(long parentId, long weeklyScoreId) {
    WeeklyScore ws = weeklyScoreRepository.findById(weeklyScoreId)
        .orElseThrow(() -> new IllegalArgumentException("Weekly score not found"));
    if (ws.getChild().getParent().getId() != parentId) {
      throw new ForbiddenException("Weekly score not accessible");
    }
    if (ws.getStatus() != WeeklyScoreStatus.SUBMITTED) {
      throw new IllegalArgumentException("Only submitted weekly score can be revoked (not draft/active/locked)");
    }
    pointsService.revokeWeeklyScoreSettlement(parentId, ws.getChild().getId(), weeklyScoreId);
    ws.setStatus(WeeklyScoreStatus.ACTIVE);
    weeklyScoreRepository.save(ws);
    return get(parentId, weeklyScoreId);
  }

  private WeeklyScoreResponse toResponse(WeeklyScore ws, List<WeeklyScoreItem> items) {
    return new WeeklyScoreResponse(
        ws.getId(),
        ws.getTemplateVersion().getId(),
        ws.getChild().getId(),
        ws.getWeekStartDate(),
        ws.getWeekEndDate(),
        ws.getStatus(),
        ws.getTotalScore(),
        ws.getCreateTime(),
        items.stream().map(this::toItemResponse).toList()
    );
  }

  private WeeklyScoreItemResponse toItemResponse(WeeklyScoreItem i) {
    return new WeeklyScoreItemResponse(i.getId(), i.getDimensionCategory(), i.getDimensionName(), i.getDayOfWeek(), i.getScore(), i.getMaxScore(), i.getRemark());
  }
}

