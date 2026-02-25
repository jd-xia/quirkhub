package com.kiddoquest.service;

import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.PointsAdjustRequest;
import com.kiddoquest.api.dto.PointsBalanceResponse;
import com.kiddoquest.api.dto.PointsLogResponse;
import com.kiddoquest.api.dto.PointsLogUpdateRequest;
import com.kiddoquest.api.dto.PointsSummaryResponse;
import com.kiddoquest.domain.*;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.PointsLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PointsService {
  private final PointsLogRepository pointsLogRepository;
  private final ChildRepository childRepository;

  @Transactional(readOnly = true)
  public PointsBalanceResponse balance(long parentIdOrChildId, boolean isParent, long childId) {
    Child child = loadChildWithAuth(parentIdOrChildId, isParent, childId);
    int bal = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    return new PointsBalanceResponse(child.getId(), bal);
  }

  @Transactional
  public PointsLogResponse adjust(long parentId, long childId, PointsAdjustRequest req) {
    if (req.changeType() == PointsChangeType.SCORE_SETTLEMENT) {
      throw new IllegalArgumentException("SCORE_SETTLEMENT is system managed");
    }
    Child child = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));

    int prev = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    int next = prev + req.scoreChange();

    PointsLog log = PointsLog.builder()
        .child(child)
        .changeType(req.changeType())
        .scoreChange(req.scoreChange())
        .balance(next)
        .description(req.description())
        .relatedId(null)
        .createTime(Instant.now())
        .build();
    pointsLogRepository.save(log);
    return toResponse(log);
  }

  @Transactional(readOnly = true)
  public PointsSummaryResponse summary(long parentIdOrChildId, boolean isParent, long childId) {
    Child child = loadChildWithAuth(parentIdOrChildId, isParent, childId);
    int bal = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    List<PointsLogResponse> logs = pointsLogRepository.findTop50ByChild_IdOrderByCreateTimeDesc(child.getId())
        .stream()
        .map(this::toResponse)
        .toList();
    return new PointsSummaryResponse(child.getId(), bal, logs);
  }

  @Transactional
  public PointsLogResponse updateManualLog(long parentId, long childId, long logId, PointsLogUpdateRequest req) {
    Child child = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));

    List<PointsLog> logs = pointsLogRepository.findAllByChild_IdOrderByCreateTimeAsc(child.getId());
    int idx = -1;
    for (int i = 0; i < logs.size(); i++) {
      if (logs.get(i).getId() != null && logs.get(i).getId().longValue() == logId) {
        idx = i;
        break;
      }
    }
    if (idx < 0) throw new ForbiddenException("Log not found");

    PointsLog target = logs.get(idx);
    if (target.getRelatedId() != null) {
      throw new IllegalArgumentException("Only manual logs can be edited");
    }
    if (target.getChangeType() != PointsChangeType.MANUAL_REWARD && target.getChangeType() != PointsChangeType.PENALTY) {
      throw new IllegalArgumentException("Only manual logs can be edited");
    }

    int scoreChange = req.scoreChange();
    target.setScoreChange(scoreChange);
    target.setDescription(req.description());
    target.setChangeType(scoreChange >= 0 ? PointsChangeType.MANUAL_REWARD : PointsChangeType.PENALTY);

    int prevBalance = idx == 0 ? 0 : logs.get(idx - 1).getBalance();
    for (int i = idx; i < logs.size(); i++) {
      PointsLog l = logs.get(i);
      prevBalance = prevBalance + l.getScoreChange();
      l.setBalance(prevBalance);
    }

    pointsLogRepository.saveAll(logs.subList(idx, logs.size()));
    return toResponse(target);
  }

  @Transactional
  public void settleWeeklyScore(long parentId, long childId, long weeklyScoreId, int pointsToAdd, String description) {
    Child child = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));

    int alreadySettled = pointsLogRepository
        .findAllByChild_IdAndChangeTypeAndRelatedId(child.getId(), PointsChangeType.SCORE_SETTLEMENT, weeklyScoreId)
        .stream()
        .mapToInt(PointsLog::getScoreChange)
        .sum();

    int delta = pointsToAdd - alreadySettled;
    if (delta == 0) return;

    int prev = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    int next = prev + delta;

    PointsLog log = PointsLog.builder()
        .child(child)
        .changeType(PointsChangeType.SCORE_SETTLEMENT)
        .scoreChange(delta)
        .balance(next)
        .description(delta == pointsToAdd ? description : (description + " (adjustment)"))
        .relatedId(weeklyScoreId)
        .createTime(Instant.now())
        .build();
    pointsLogRepository.save(log);
  }

  @Transactional
  public void revokeWeeklyScoreSettlement(long parentId, long childId, long weeklyScoreId) {
    Child child = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));

    int settled = pointsLogRepository
        .findAllByChild_IdAndChangeTypeAndRelatedId(child.getId(), PointsChangeType.SCORE_SETTLEMENT, weeklyScoreId)
        .stream()
        .mapToInt(PointsLog::getScoreChange)
        .sum();

    if (settled == 0) return;

    int prev = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    int next = prev - settled;

    PointsLog log = PointsLog.builder()
        .child(child)
        .changeType(PointsChangeType.SCORE_SETTLEMENT)
        .scoreChange(-settled)
        .balance(next)
        .description("周总结撤回（已结算积分已扣回）")
        .relatedId(weeklyScoreId)
        .createTime(Instant.now())
        .build();
    pointsLogRepository.save(log);
  }

  @Transactional
  public PointsLog refundReward(long parentId, long childId, int pointsToRefund, String description) {
    if (pointsToRefund <= 0) throw new IllegalArgumentException("pointsToRefund must be > 0");
    Child child = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));
    int prev = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    int next = prev + pointsToRefund;
    PointsLog log = PointsLog.builder()
        .child(child)
        .changeType(PointsChangeType.MANUAL_REWARD)
        .scoreChange(pointsToRefund)
        .balance(next)
        .description(description)
        .relatedId(null)
        .createTime(Instant.now())
        .build();
    pointsLogRepository.save(log);
    return log;
  }

  @Transactional
  public PointsLog redeemReward(long childId, int costPoints, String description, Long relatedId) {
    if (costPoints <= 0) throw new IllegalArgumentException("costPoints must be > 0");
    Child child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));

    int prev = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    if (prev < costPoints) {
      throw new IllegalArgumentException("Not enough points");
    }
    int next = prev - costPoints;

    PointsLog log = PointsLog.builder()
        .child(child)
        .changeType(PointsChangeType.REWARD_REDEEM)
        .scoreChange(-costPoints)
        .balance(next)
        .description(description)
        .relatedId(relatedId)
        .createTime(Instant.now())
        .build();
    pointsLogRepository.save(log);
    return log;
  }

  @Transactional
  public PointsLog systemReward(long childId, int pointsToAdd, String description, Long relatedId) {
    if (pointsToAdd <= 0) throw new IllegalArgumentException("pointsToAdd must be > 0");
    Child child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));

    int prev = pointsLogRepository.findTop1ByChild_IdOrderByCreateTimeDesc(child.getId())
        .map(PointsLog::getBalance)
        .orElse(0);
    int next = prev + pointsToAdd;

    PointsLog log = PointsLog.builder()
        .child(child)
        .changeType(PointsChangeType.GAME_REWARD)
        .scoreChange(pointsToAdd)
        .balance(next)
        .description(description)
        .relatedId(relatedId)
        .createTime(Instant.now())
        .build();
    pointsLogRepository.save(log);
    return log;
  }

  private Child loadChildWithAuth(long userId, boolean isParent, long childId) {
    if (isParent) {
      return childRepository.findByIdAndParent_Id(childId, userId)
          .orElseThrow(() -> new ForbiddenException("Child not found"));
    }
    if (userId != childId) {
      throw new ForbiddenException("Cannot access other child's points");
    }
    return childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
  }

  private PointsLogResponse toResponse(PointsLog log) {
    return new PointsLogResponse(
        log.getId(),
        log.getChangeType(),
        log.getScoreChange(),
        log.getBalance(),
        log.getDescription(),
        log.getRelatedId(),
        log.getCreateTime()
    );
  }
}

