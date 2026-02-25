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
@Table(name = "shop_item", indexes = {
    @Index(name = "idx_shop_item_parent_status", columnList = "parent_id, status"),
    @Index(name = "idx_shop_item_child_status", columnList = "child_id, status")
})
public class ShopItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "parent_id", nullable = false)
  private Parent parent;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "child_id")
  private Child child;

  @Column(name = "name", nullable = false, length = 64)
  private String name;

  @Column(name = "description", length = 512)
  private String description;

  @Column(name = "cost_points", nullable = false)
  private Integer costPoints;

  @Column(name = "stock")
  private Integer stock;

  @Column(name = "icon", length = 32)
  private String icon;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 16)
  private ShopItemStatus status;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;

  @Column(name = "update_time", nullable = false)
  private Instant updateTime;
}

