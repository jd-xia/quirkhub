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
@Table(name = "template_version",
    uniqueConstraints = @UniqueConstraint(name = "uk_template_version", columnNames = {"template_id", "version"}))
public class TemplateVersion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "template_id", nullable = false)
  private Template template;

  @Column(name = "version", nullable = false)
  private Integer version;

  @Lob
  @Column(name = "snapshot", nullable = false, columnDefinition = "LONGTEXT")
  private String snapshot;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;
}

