package com.kiddoquest.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "weekly_score",
    uniqueConstraints = @UniqueConstraint(name = "uk_weekly_score_unique", columnNames = {"child_id", "week_start_date"}))
public class WeeklyScore {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "template_version_id", nullable = false)
  private TemplateVersion templateVersion;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "child_id", nullable = false)
  private Child child;

  @Column(name = "week_start_date", nullable = false)
  private LocalDate weekStartDate;

  @Column(name = "week_end_date", nullable = false)
  private LocalDate weekEndDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private WeeklyScoreStatus status;

  @Column(name = "total_score", nullable = false)
  private Integer totalScore;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;
}

