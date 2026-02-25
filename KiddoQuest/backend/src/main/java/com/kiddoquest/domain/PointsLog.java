package com.kiddoquest.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "points_log", indexes = {
    @Index(name = "idx_points_log_child_time", columnList = "child_id, create_time")
})
public class PointsLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "child_id", nullable = false)
  private Child child;

  @Enumerated(EnumType.STRING)
  @Column(name = "change_type", nullable = false, length = 32)
  private PointsChangeType changeType;

  @Column(name = "score_change", nullable = false)
  private Integer scoreChange;

  @Column(name = "balance", nullable = false)
  private Integer balance;

  @Column(name = "description", length = 512)
  private String description;

  @Column(name = "related_id")
  private Long relatedId;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;
}

