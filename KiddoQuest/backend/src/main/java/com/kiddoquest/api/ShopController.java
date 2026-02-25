package com.kiddoquest.api;

import com.kiddoquest.api.dto.*;
import com.kiddoquest.security.AuthPrincipal;
import com.kiddoquest.security.Authz;
import com.kiddoquest.security.Role;
import com.kiddoquest.service.ShopService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shop")
@RequiredArgsConstructor
public class ShopController {
  private final ShopService shopService;

  @GetMapping("/items")
  public ResponseEntity<List<ShopItemResponse>> listItems(Authentication authentication, @RequestParam(value = "childId", required = false) Long childId) {
    AuthPrincipal p = Authz.requirePrincipal(authentication);
    if (p.role() == Role.PARENT) {
      return ResponseEntity.ok(shopService.listItemsForParent(p.userId(), childId));
    }
    long cid = childId == null ? p.userId() : childId;
    if (cid != p.userId()) throw new ForbiddenException("Cannot access other child's shop");
    return ResponseEntity.ok(shopService.listItemsForChild(p.userId()));
  }

  @PostMapping("/items")
  public ResponseEntity<ShopItemResponse> createItem(Authentication authentication, @Valid @RequestBody ShopItemCreateRequest req) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(shopService.createItem(p.userId(), req));
  }

  @PutMapping("/items/{id}")
  public ResponseEntity<ShopItemResponse> updateItem(
      Authentication authentication,
      @PathVariable("id") long id,
      @Valid @RequestBody ShopItemUpdateRequest req
  ) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(shopService.updateItem(p.userId(), id, req));
  }

  @DeleteMapping("/items/{id}")
  public ResponseEntity<Void> deleteItem(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    shopService.deleteItem(p.userId(), id);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/items/{id}/redeem")
  public ResponseEntity<ShopPurchaseResponse> redeem(
      Authentication authentication,
      @PathVariable("id") long itemId,
      @Valid @RequestBody(required = false) ShopRedeemRequest req
  ) {
    var c = Authz.requireChild(authentication);
    ShopRedeemRequest safe = req == null ? new ShopRedeemRequest(1) : req;
    return ResponseEntity.ok(shopService.redeem(c.userId(), itemId, safe));
  }

  @GetMapping("/purchases")
  public ResponseEntity<List<ShopPurchaseResponse>> purchases(Authentication authentication, @RequestParam("childId") long childId) {
    AuthPrincipal p = Authz.requirePrincipal(authentication);
    boolean isParent = p.role() == Role.PARENT;
    return ResponseEntity.ok(shopService.purchases(p.userId(), isParent, childId));
  }

  @PostMapping("/purchases/{id}/revoke")
  public ResponseEntity<ShopPurchaseResponse> revokePurchase(Authentication authentication, @PathVariable("id") long id) {
    var p = Authz.requireParent(authentication);
    return ResponseEntity.ok(shopService.revokePurchase(p.userId(), id));
  }
}

