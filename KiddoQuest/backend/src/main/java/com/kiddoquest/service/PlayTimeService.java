package com.kiddoquest.service;

import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.PlayTimeBalanceResponse;
import com.kiddoquest.api.dto.PlayTimeConsumeRequest;
import com.kiddoquest.api.dto.PlayTimeLogResponse;
import com.kiddoquest.api.dto.PlayTimeRedeemRequest;
import com.kiddoquest.api.dto.PlayTimeSummaryResponse;
import com.kiddoquest.config.GameProperties;
import com.kiddoquest.domain.Child;
import com.kiddoquest.domain.PlayTimeChangeType;
import com.kiddoquest.domain.PlayTimeLog;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.PlayTimeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PlayTimeService {
  private final PlayTimeLogRepository playTimeLogRepository;
  private final ChildRepository childRepository;
  private final PointsService pointsService;
  private final GameProperties gameProperties;

  @Transactional(readOnly = true)
  public PlayTimeBalanceResponse balance(long parentIdOrChildId, boolean isParent, long childId) {
    Child child = loadChildWithAuth(parentIdOrChildId, isParent, childId);
    int bal = playTimeLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PlayTimeLog::getBalanceMinutes)
        .orElse(0);
    return new PlayTimeBalanceResponse(child.getId(), bal);
  }

  @Transactional(readOnly = true)
  public PlayTimeSummaryResponse summary(long parentIdOrChildId, boolean isParent, long childId) {
    Child child = loadChildWithAuth(parentIdOrChildId, isParent, childId);
    int bal = playTimeLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PlayTimeLog::getBalanceMinutes)
        .orElse(0);
    List<PlayTimeLogResponse> logs = playTimeLogRepository.findTop50ByChild_IdOrderByCreateTimeDesc(child.getId())
        .stream()
        .map(this::toResponse)
        .toList();
    return new PlayTimeSummaryResponse(child.getId(), bal, logs);
  }

  @Transactional
  public PlayTimeLogResponse redeemFromPoints(long childId, PlayTimeRedeemRequest req) {
    int minutes = req.minutes();
    if (minutes <= 0) throw new IllegalArgumentException("minutes must be > 0");
    int minutesPerPoint = Math.max(1, gameProperties.getMinutesPerPoint());
    int costPoints = (int) Math.ceil(minutes / (double) minutesPerPoint);

    int maxPerMonth = Math.max(1, gameProperties.getMaxRedeemsPerMonth());
    Instant[] monthRange = currentMonthRange();
    long cnt = playTimeLogRepository.countByChild_IdAndChangeTypeAndCreateTimeBetween(
        childId, PlayTimeChangeType.REDEEM_FROM_POINTS, monthRange[0], monthRange[1]
    );
    if (cnt >= maxPerMonth) {
      throw new IllegalArgumentException("Monthly redeem limit reached (" + maxPerMonth + ")");
    }

    Child child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
    int prevMinutes = playTimeLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(childId)
        .map(PlayTimeLog::getBalanceMinutes)
        .orElse(0);
    int nextMinutes = prevMinutes + minutes;

    PlayTimeLog log = PlayTimeLog.builder()
        .child(child)
        .changeType(PlayTimeChangeType.REDEEM_FROM_POINTS)
        .minutesChange(minutes)
        .balanceMinutes(nextMinutes)
        .description("积分兑换游戏时间：" + minutes + " 分钟（-" + costPoints + "）")
        .relatedId(null)
        .createTime(Instant.now())
        .build();
    playTimeLogRepository.save(log);

    pointsService.redeemReward(childId, costPoints, "兑换游戏时间：" + minutes + " 分钟", log.getId());
    return toResponse(log);
  }

  @Transactional
  public PlayTimeLogResponse consume(long childId, PlayTimeConsumeRequest req) {
    int minutes = req.minutes();
    if (minutes <= 0) throw new IllegalArgumentException("minutes must be > 0");

    Child child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
    int prev = playTimeLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(childId)
        .map(PlayTimeLog::getBalanceMinutes)
        .orElse(0);
    if (prev <= 0) throw new IllegalArgumentException("No playtime available");

    int used = Math.min(minutes, prev);
    int next = prev - used;
    String game = (req.game() == null || req.game().isBlank()) ? "小游戏" : req.game().trim();

    PlayTimeLog log = PlayTimeLog.builder()
        .child(child)
        .changeType(PlayTimeChangeType.CONSUME_GAME)
        .minutesChange(-used)
        .balanceMinutes(next)
        .description("玩游戏：" + game + "（-" + used + " 分钟）")
        .relatedId(null)
        .createTime(Instant.now())
        .build();
    playTimeLogRepository.save(log);
    return toResponse(log);
  }

  private Child loadChildWithAuth(long userId, boolean isParent, long childId) {
    if (isParent) {
      return childRepository.findByIdAndParent_Id(childId, userId)
          .orElseThrow(() -> new ForbiddenException("Child not found"));
    }
    if (userId != childId) {
      throw new ForbiddenException("Cannot access other child's playtime");
    }
    return childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
  }

  private PlayTimeLogResponse toResponse(PlayTimeLog log) {
    return new PlayTimeLogResponse(
        log.getId(),
        log.getChangeType(),
        log.getMinutesChange(),
        log.getBalanceMinutes(),
        log.getDescription(),
        log.getRelatedId(),
        log.getCreateTime()
    );
  }

  private Instant[] currentMonthRange() {
    ZoneId zone = ZoneId.systemDefault();
    LocalDate today = LocalDate.now(zone);
    ZonedDateTime start = today.withDayOfMonth(1).atStartOfDay(zone);
    ZonedDateTime end = start.plusMonths(1);
    return new Instant[] { start.toInstant(), end.toInstant() };
  }
}

