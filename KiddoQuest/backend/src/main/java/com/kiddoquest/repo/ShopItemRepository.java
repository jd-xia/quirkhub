package com.kiddoquest.repo;

import com.kiddoquest.domain.ShopItem;
import com.kiddoquest.domain.ShopItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ShopItemRepository extends JpaRepository<ShopItem, Long> {
  Optional<ShopItem> findByIdAndParent_Id(long id, long parentId);

  List<ShopItem> findAllByParent_IdAndStatusOrderByUpdateTimeDesc(long parentId, ShopItemStatus status);

  @Query("""
      select i from ShopItem i
      where i.parent.id = :parentId
        and i.status = :status
        and (:childId is null or i.child is null or i.child.id = :childId)
      order by i.updateTime desc
      """)
  List<ShopItem> listVisibleItems(
      @Param("parentId") long parentId,
      @Param("status") ShopItemStatus status,
      @Param("childId") Long childId
  );
}

