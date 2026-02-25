package com.kiddoquest.service;

import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.*;
import com.kiddoquest.domain.Child;
import com.kiddoquest.domain.DimensionCategory;
import com.kiddoquest.domain.PointsChangeType;
import com.kiddoquest.domain.PointsLog;
import com.kiddoquest.domain.WeeklyScore;
import com.kiddoquest.domain.WeeklyScoreItem;
import com.kiddoquest.domain.WeeklyScoreStatus;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.PointsLogRepository;
import com.kiddoquest.repo.WeeklyScoreItemRepository;
import com.kiddoquest.repo.WeeklyScoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {
  private final ChildRepository childRepository;
  private final WeeklyScoreRepository weeklyScoreRepository;
  private final WeeklyScoreItemRepository weeklyScoreItemRepository;
  private final PointsLogRepository pointsLogRepository;

  @Transactional(readOnly = true)
  public DashboardFamilyResponse family(long parentId) {
    LocalDate weekStart = currentWeekStart();
    List<DashboardChildResponse> children = childRepository.findAllByParent_Id(parentId).stream()
        .map(c -> toChild(parentId, c, weekStart))
        .toList();
    return new DashboardFamilyResponse(children);
  }

  @Transactional(readOnly = true)
  public DashboardFamilyV2Response familyV2(long parentId) {
    LocalDate weekStart = currentWeekStart();
    List<DashboardChildStatsResponse> children = childRepository.findAllByParent_Id(parentId).stream()
        .map(c -> toChildStats(parentId, c, weekStart))
        .toList();
    return new DashboardFamilyV2Response(weekStart, children);
  }

  @Transactional(readOnly = true)
  public DashboardChildResponse child(long parentId, long childId) {
    Child c = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));
    return toChild(parentId, c, currentWeekStart());
  }

  private DashboardChildResponse toChild(long parentId, Child c, LocalDate weekStart) {
    int balance = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(c.getId())
        .map(pl -> pl.getBalance())
        .orElse(0);
    var wsOpt = weeklyScoreRepository.findByChild_IdAndWeekStartDate(c.getId(), weekStart);
    int total = wsOpt.map(ws -> ws.getTotalScore() == null ? 0 : ws.getTotalScore()).orElse(0);
    // 未结算分数：所有 DRAFT/ACTIVE 周的 totalScore 之和（已结算周已写入 points_log，包含在 balance 中）
    List<WeeklyScore> allWeeks = weeklyScoreRepository.findAllByChild_Id(c.getId());
    int unsettledTotal = allWeeks.stream()
        .filter(ws -> ws.getStatus() == WeeklyScoreStatus.DRAFT || ws.getStatus() == WeeklyScoreStatus.ACTIVE)
        .mapToInt(ws -> ws.getTotalScore() == null ? 0 : ws.getTotalScore())
        .sum();
    int balanceIncludingCurrentWeek = balance + unsettledTotal;
    return new DashboardChildResponse(c.getId(), c.getName(), balance, balanceIncludingCurrentWeek, weekStart, total);
  }

  private DashboardChildStatsResponse toChildStats(long parentId, Child c, LocalDate weekStart) {
    DashboardChildResponse base = toChild(parentId, c, weekStart);

    List<Integer> dayTotals = new ArrayList<>(List.of(0, 0, 0, 0, 0, 0, 0));
    int learning = 0;
    int life = 0;
    int bonus = 0;
    int penalty = 0;

    var wsOpt = weeklyScoreRepository.findByChild_IdAndWeekStartDate(c.getId(), weekStart);
    if (wsOpt.isPresent()) {
      var ws = wsOpt.get();
      List<WeeklyScoreItem> items = weeklyScoreItemRepository.findAllByWeeklyScore_Id(ws.getId());
      for (WeeklyScoreItem it : items) {
        int day = it.getDayOfWeek() == null ? 0 : it.getDayOfWeek();
        if (day >= 1 && day <= 7) {
          dayTotals.set(day - 1, dayTotals.get(day - 1) + (it.getScore() == null ? 0 : it.getScore()));
        }
        DimensionCategory cat = it.getDimensionCategory();
        int s = it.getScore() == null ? 0 : it.getScore();
        if (cat == DimensionCategory.LEARNING) learning += s;
        else if (cat == DimensionCategory.LIFE) life += s;
        else if (cat == DimensionCategory.BONUS) bonus += s;
        else if (cat == DimensionCategory.PENALTY) penalty += s;
      }
    }

    DashboardCategoryTotals catTotals = new DashboardCategoryTotals(learning, life, bonus, penalty);

    LocalDate minWeek = weekStart.minusWeeks(5);
    List<DashboardWeekTrendPoint> trend = weeklyScoreRepository
        .findAllByChild_IdAndWeekStartDateGreaterThanEqualOrderByWeekStartDateAsc(c.getId(), minWeek)
        .stream()
        .map(ws -> new DashboardWeekTrendPoint(
            ws.getWeekStartDate(),
            ws.getTotalScore() == null ? 0 : ws.getTotalScore(),
            ws.getStatus() == null ? WeeklyScoreStatus.DRAFT : ws.getStatus()
        ))
        .toList();

    DashboardPointsWindow points30d = pointsWindow(c.getId(), 30);

    List<DashboardItemTotal> allTimeItemTotals = weeklyScoreItemRepository
        .sumItemTotalsByChild(c.getId(), List.of(WeeklyScoreStatus.SUBMITTED, WeeklyScoreStatus.LOCKED))
        .stream()
        .map(r -> new DashboardItemTotal(
            r.getCategory(),
            r.getDimensionName(),
            r.getTotalScore() == null ? 0 : r.getTotalScore()
        ))
        .toList();

    return new DashboardChildStatsResponse(
        base.childId(),
        base.childName(),
        base.pointsBalance(),
        base.pointsBalanceIncludingCurrentWeek(),
        base.weekStartDate(),
        base.weekTotalScore(),
        dayTotals,
        catTotals,
        trend,
        points30d,
        allTimeItemTotals
    );
  }

  private DashboardPointsWindow pointsWindow(long childId, int days) {
    Instant after = Instant.now().minus(days, ChronoUnit.DAYS);
    List<PointsLog> logs = pointsLogRepository.findAllByChild_IdAndCreateTimeAfterOrderByCreateTimeDesc(childId, after);
    int earned = 0;
    int spent = 0;
    int redeemCount = 0;
    int redeemSpent = 0;
    for (PointsLog l : logs) {
      int ch = l.getScoreChange() == null ? 0 : l.getScoreChange();
      if (ch > 0) earned += ch;
      if (ch < 0) spent += -ch;
      if (l.getChangeType() == PointsChangeType.REWARD_REDEEM) {
        redeemCount += 1;
        if (ch < 0) redeemSpent += -ch;
      }
    }
    return new DashboardPointsWindow(days, earned, spent, earned - spent, redeemCount, redeemSpent);
  }

  private LocalDate currentWeekStart() {
    LocalDate today = LocalDate.now();
    DayOfWeek dow = today.getDayOfWeek();
    int delta = dow.getValue() - DayOfWeek.MONDAY.getValue();
    return today.minusDays(delta);
  }
}

