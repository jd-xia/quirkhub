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
@Table(name = "template")
public class Template {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "name", nullable = false, length = 128)
  private String name;

  @Column(name = "description", length = 512)
  private String description;

  @Column(name = "default_point", nullable = false)
  private Integer defaultPoint;

  @Column(name = "version", nullable = false)
  private Integer version;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private TemplateStatus status;

  @Column(name = "created_by", nullable = false)
  private Long createdBy;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;

  @Column(name = "update_time", nullable = false)
  private Instant updateTime;
}

