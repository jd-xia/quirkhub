package com.kiddoquest.service;

import com.kiddoquest.api.dto.*;
import com.kiddoquest.config.GameProperties;
import com.kiddoquest.domain.PointsLog;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GamesService {
  private final PlayTimeService playTimeService;
  private final PointsService pointsService;
  private final GameProperties gameProperties;

  @Transactional
  public GameSubmitRewardResponse submitEssay(long childId, GameEssaySubmitRequest req) {
    String content = req.content() == null ? "" : req.content().trim();
    if (normalize(content).length() < 20) {
      throw new IllegalArgumentException("Essay too short (min 20 chars)");
    }

    PlayTimeLogResponse pt = playTimeService.consume(childId, new PlayTimeConsumeRequest(req.minutesUsed(), "小作文"));
    int award = Math.max(0, gameProperties.getEssayRewardPoints());
    PointsLog pl = award > 0 ? pointsService.systemReward(childId, award, "游戏奖励：小作文《" + req.promptTitle() + "》", null) : null;
    int pointsBal = pl == null ? pointsService.balance(childId, false, childId).balance() : pl.getBalance();
    return new GameSubmitRewardResponse(award, pointsBal, pt.balanceMinutes());
  }

  @Transactional
  public GameSubmitRewardResponse submitDictation(long childId, GameDictationSubmitRequest req) {
    int total = req.total();
    int correct = req.correct();
    if (correct < 0 || correct > total) throw new IllegalArgumentException("Invalid correct/total");

    PlayTimeLogResponse pt = playTimeService.consume(childId, new PlayTimeConsumeRequest(req.minutesUsed(), "听写"));
    int award = Math.max(0, gameProperties.getDictationRewardPoints());
    PointsLog pl = award > 0 ? pointsService.systemReward(childId, award, "游戏奖励：听写（" + correct + "/" + total + "）", null) : null;
    int pointsBal = pl == null ? pointsService.balance(childId, false, childId).balance() : pl.getBalance();
    return new GameSubmitRewardResponse(award, pointsBal, pt.balanceMinutes());
  }

  private static String normalize(String s) {
    return (s == null ? "" : s)
        .trim()
        .replaceAll("[\\s，。！？!?,.、；;：“”\"\"'‘’（）()【】\\[\\]《》<>]", "")
        .toLowerCase();
  }
}

