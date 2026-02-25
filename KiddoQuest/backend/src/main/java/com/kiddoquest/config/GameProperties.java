package com.kiddoquest.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "kiddoquest.game")
public class GameProperties {
  private int minutesPerPoint = 1;
  private int maxRedeemsPerMonth = 30;
  private int essayRewardPoints = 5;
  private int dictationRewardPoints = 2;
}

