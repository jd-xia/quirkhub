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
@Table(name = "shop_purchase", indexes = {
    @Index(name = "idx_shop_purchase_child_time", columnList = "child_id, create_time"),
    @Index(name = "idx_shop_purchase_parent_time", columnList = "parent_id, create_time")
})
public class ShopPurchase {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "parent_id", nullable = false)
  private Parent parent;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "child_id", nullable = false)
  private Child child;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "item_id", nullable = false)
  private ShopItem item;

  @Column(name = "item_name", nullable = false, length = 64)
  private String itemName;

  @Column(name = "item_icon", length = 32)
  private String itemIcon;

  @Column(name = "cost_points", nullable = false)
  private Integer costPoints;

  @Column(name = "quantity", nullable = false)
  private Integer quantity;

  @Column(name = "total_cost_points", nullable = false)
  private Integer totalCostPoints;

  @Column(name = "revoked", nullable = false)
  private Boolean revoked = false;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;
}

