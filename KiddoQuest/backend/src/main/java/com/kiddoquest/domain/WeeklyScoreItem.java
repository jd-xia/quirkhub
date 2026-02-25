package com.kiddoquest.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "weekly_score_item",
    uniqueConstraints = @UniqueConstraint(name = "uk_weekly_score_item", columnNames = {"weekly_score_id", "dimension_name", "dimension_category", "day_of_week"}))
public class WeeklyScoreItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "weekly_score_id", nullable = false)
  private WeeklyScore weeklyScore;

  @Column(name = "dimension_name", nullable = false, length = 128)
  private String dimensionName;

  @Enumerated(EnumType.STRING)
  @Column(name = "dimension_category", nullable = false, length = 16)
  private DimensionCategory dimensionCategory;

  @Column(name = "day_of_week", nullable = false)
  private Integer dayOfWeek;

  @Column(name = "score", nullable = false)
  private Integer score;

  @Column(name = "max_score", nullable = false)
  private Integer maxScore;

  @Column(name = "remark", length = 512)
  private String remark;
}

