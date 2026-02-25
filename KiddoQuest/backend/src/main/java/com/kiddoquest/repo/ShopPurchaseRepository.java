package com.kiddoquest.repo;

import com.kiddoquest.domain.ShopPurchase;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopPurchaseRepository extends JpaRepository<ShopPurchase, Long> {
  List<ShopPurchase> findTop50ByChild_IdOrderByCreateTimeDesc(long childId);

  List<ShopPurchase> findTop50ByChild_IdAndParent_IdOrderByCreateTimeDesc(long childId, long parentId);
}

