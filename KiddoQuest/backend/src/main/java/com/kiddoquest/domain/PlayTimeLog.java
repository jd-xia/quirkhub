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
@Table(name = "play_time_log", indexes = {
    @Index(name = "idx_play_time_log_child_time", columnList = "child_id, create_time")
})
public class PlayTimeLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "child_id", nullable = false)
  private Child child;

  @Enumerated(EnumType.STRING)
  @Column(name = "change_type", nullable = false, length = 32)
  private PlayTimeChangeType changeType;

  @Column(name = "minutes_change", nullable = false)
  private Integer minutesChange;

  @Column(name = "balance_minutes", nullable = false)
  private Integer balanceMinutes;

  @Column(name = "description", length = 512)
  private String description;

  @Column(name = "related_id")
  private Long relatedId;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;
}

