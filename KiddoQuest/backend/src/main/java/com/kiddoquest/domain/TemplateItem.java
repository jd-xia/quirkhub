package com.kiddoquest.domain;

import jakarta.persistence.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "template_item")
public class TemplateItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "template_version_id", nullable = false)
  private TemplateVersion templateVersion;

  @Column(name = "name", nullable = false, length = 128)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false, length = 16)
  private DimensionCategory category;

  @Column(name = "description", length = 512)
  private String description;

  @Column(name = "earning_point", nullable = false)
  private Integer earningPoint;

  @Enumerated(EnumType.STRING)
  @Column(name = "score_type", nullable = false, length = 16)
  private ScoreType scoreType;
}

