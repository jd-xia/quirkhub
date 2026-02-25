package com.kiddoquest.repo;

import com.kiddoquest.domain.Template;
import com.kiddoquest.domain.TemplateStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemplateRepository extends JpaRepository<Template, Long> {
  List<Template> findAllByCreatedByAndStatus(long createdBy, TemplateStatus status);
  Optional<Template> findByIdAndCreatedBy(long id, long createdBy);
  boolean existsByCreatedByAndName(long createdBy, String name);
}

