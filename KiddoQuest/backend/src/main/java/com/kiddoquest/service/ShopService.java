package com.kiddoquest.service;

import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.*;
import com.kiddoquest.domain.*;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.ParentRepository;
import com.kiddoquest.repo.ShopItemRepository;
import com.kiddoquest.repo.ShopPurchaseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShopService {
  private final ShopItemRepository shopItemRepository;
  private final ShopPurchaseRepository shopPurchaseRepository;
  private final ParentRepository parentRepository;
  private final ChildRepository childRepository;
  private final PointsService pointsService;

  @Transactional(readOnly = true)
  public List<ShopItemResponse> listItemsForParent(long parentId, Long childId) {
    if (childId != null) {
      childRepository.findByIdAndParent_Id(childId, parentId).orElseThrow(() -> new ForbiddenException("Child not found"));
    }
    return shopItemRepository.listVisibleItems(parentId, ShopItemStatus.ACTIVE, childId)
        .stream()
        .map(this::toItemResponse)
        .toList();
  }

  @Transactional(readOnly = true)
  public List<ShopItemResponse> listItemsForChild(long childId) {
    Child child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
    long parentId = child.getParent().getId();
    return shopItemRepository.listVisibleItems(parentId, ShopItemStatus.ACTIVE, childId)
        .stream()
        .map(this::toItemResponse)
        .toList();
  }

  @Transactional
  public ShopItemResponse createItem(long parentId, ShopItemCreateRequest req) {
    Parent parent = parentRepository.findById(parentId).orElseThrow(() -> new ForbiddenException("Parent not found"));
    Child child = null;
    if (req.childId() != null) {
      child = childRepository.findByIdAndParent_Id(req.childId(), parentId).orElseThrow(() -> new ForbiddenException("Child not found"));
    }
    Instant now = Instant.now();
    ShopItem it = ShopItem.builder()
        .parent(parent)
        .child(child)
        .name(req.name())
        .description(req.description())
        .costPoints(req.costPoints())
        .stock(req.stock())
        .icon(req.icon())
        .status(ShopItemStatus.ACTIVE)
        .createTime(now)
        .updateTime(now)
        .build();
    shopItemRepository.save(it);
    return toItemResponse(it);
  }

  @Transactional
  public ShopItemResponse updateItem(long parentId, long itemId, ShopItemUpdateRequest req) {
    ShopItem it = shopItemRepository.findByIdAndParent_Id(itemId, parentId)
        .orElseThrow(() -> new ForbiddenException("Item not found"));
    Child child = null;
    if (req.childId() != null) {
      child = childRepository.findByIdAndParent_Id(req.childId(), parentId).orElseThrow(() -> new ForbiddenException("Child not found"));
    }
    it.setChild(child);
    it.setName(req.name());
    it.setDescription(req.description());
    it.setCostPoints(req.costPoints());
    it.setStock(req.stock());
    it.setIcon(req.icon());
    it.setUpdateTime(Instant.now());
    shopItemRepository.save(it);
    return toItemResponse(it);
  }

  @Transactional
  public void deleteItem(long parentId, long itemId) {
    ShopItem it = shopItemRepository.findByIdAndParent_Id(itemId, parentId)
        .orElseThrow(() -> new ForbiddenException("Item not found"));
    it.setStatus(ShopItemStatus.DELETED);
    it.setUpdateTime(Instant.now());
    shopItemRepository.save(it);
  }

  @Transactional
  public ShopPurchaseResponse redeem(long childId, long itemId, ShopRedeemRequest req) {
    int qty = req.quantity() == null ? 1 : req.quantity();
    if (qty <= 0) throw new IllegalArgumentException("quantity must be >= 1");

    Child child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
    long parentId = child.getParent().getId();

    ShopItem it = shopItemRepository.findById(itemId).orElseThrow(() -> new ForbiddenException("Item not found"));
    if (it.getStatus() != ShopItemStatus.ACTIVE) throw new ForbiddenException("Item not found");
    if (it.getParent().getId() != parentId) throw new ForbiddenException("Item not found");
    if (it.getChild() != null && it.getChild().getId() != childId) throw new ForbiddenException("Item not available");

    if (it.getStock() != null) {
      if (it.getStock() < qty) throw new IllegalArgumentException("Not enough stock");
      it.setStock(it.getStock() - qty);
      it.setUpdateTime(Instant.now());
      shopItemRepository.save(it);
    }

    int totalCost = it.getCostPoints() * qty;
    Instant now = Instant.now();
    ShopPurchase p = ShopPurchase.builder()
        .parent(child.getParent())
        .child(child)
        .item(it)
        .itemName(it.getName())
        .itemIcon(it.getIcon())
        .costPoints(it.getCostPoints())
        .quantity(qty)
        .totalCostPoints(totalCost)
        .revoked(false)
        .createTime(now)
        .build();
    shopPurchaseRepository.save(p);

    PointsLog log = pointsService.redeemReward(childId, totalCost, "兑换：" + it.getName(), p.getId());
    return new ShopPurchaseResponse(
        p.getId(),
        childId,
        it.getId(),
        p.getItemName(),
        p.getItemIcon(),
        p.getCostPoints(),
        p.getQuantity(),
        p.getTotalCostPoints(),
        log.getBalance(),
        Boolean.TRUE.equals(p.getRevoked()),
        p.getCreateTime()
    );
  }

  @Transactional(readOnly = true)
  public List<ShopPurchaseResponse> purchases(long userId, boolean isParent, long childId) {
    Child child;
    if (isParent) {
      child = childRepository.findByIdAndParent_Id(childId, userId).orElseThrow(() -> new ForbiddenException("Child not found"));
      return shopPurchaseRepository.findTop50ByChild_IdAndParent_IdOrderByCreateTimeDesc(child.getId(), userId)
          .stream()
          .map(p -> new ShopPurchaseResponse(
              p.getId(),
              p.getChild().getId(),
              p.getItem().getId(),
              p.getItemName(),
              p.getItemIcon(),
              p.getCostPoints(),
              p.getQuantity(),
              p.getTotalCostPoints(),
              0,
              Boolean.TRUE.equals(p.getRevoked()),
              p.getCreateTime()
          ))
          .toList();
    }

    if (userId != childId) throw new ForbiddenException("Cannot access other child's purchases");
    child = childRepository.findById(childId).orElseThrow(() -> new ForbiddenException("Child not found"));
    return shopPurchaseRepository.findTop50ByChild_IdOrderByCreateTimeDesc(child.getId())
        .stream()
        .map(p -> new ShopPurchaseResponse(
            p.getId(),
            p.getChild().getId(),
            p.getItem().getId(),
            p.getItemName(),
            p.getItemIcon(),
            p.getCostPoints(),
            p.getQuantity(),
            p.getTotalCostPoints(),
            0,
            Boolean.TRUE.equals(p.getRevoked()),
            p.getCreateTime()
        ))
        .toList();
  }

  @Transactional
  public ShopPurchaseResponse revokePurchase(long parentId, long purchaseId) {
    ShopPurchase p = shopPurchaseRepository.findById(purchaseId)
        .orElseThrow(() -> new IllegalArgumentException("Purchase not found"));
    if (!p.getParent().getId().equals(parentId)) {
      throw new ForbiddenException("Purchase not accessible");
    }
    if (Boolean.TRUE.equals(p.getRevoked())) {
      throw new IllegalArgumentException("Purchase already revoked");
    }
    pointsService.refundReward(parentId, p.getChild().getId(), p.getTotalCostPoints(),
        "撤回兑换：" + p.getItemName());
    p.setRevoked(true);
    shopPurchaseRepository.save(p);
    int balance = pointsService.summary(parentId, true, p.getChild().getId()).balance();
    return new ShopPurchaseResponse(
        p.getId(),
        p.getChild().getId(),
        p.getItem().getId(),
        p.getItemName(),
        p.getItemIcon(),
        p.getCostPoints(),
        p.getQuantity(),
        p.getTotalCostPoints(),
        balance,
        true,
        p.getCreateTime()
    );
  }

  private ShopItemResponse toItemResponse(ShopItem it) {
    return new ShopItemResponse(
        it.getId(),
        it.getChild() == null ? null : it.getChild().getId(),
        it.getName(),
        it.getDescription(),
        it.getCostPoints(),
        it.getStock(),
        it.getIcon(),
        it.getStatus(),
        it.getCreateTime(),
        it.getUpdateTime()
    );
  }
}

