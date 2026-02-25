package com.kiddoquest.repo;

import com.kiddoquest.domain.TemplateVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TemplateVersionRepository extends JpaRepository<TemplateVersion, Long> {
  List<TemplateVersion> findAllByTemplate_IdOrderByVersionDesc(long templateId);
  Optional<TemplateVersion> findByTemplate_IdAndVersion(long templateId, int version);
}

