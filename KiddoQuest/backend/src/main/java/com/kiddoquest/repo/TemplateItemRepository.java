package com.kiddoquest.repo;

import com.kiddoquest.domain.TemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TemplateItemRepository extends JpaRepository<TemplateItem, Long> {
  List<TemplateItem> findAllByTemplateVersion_Id(long templateVersionId);
  void deleteAllByTemplateVersion_Id(long templateVersionId);
}

