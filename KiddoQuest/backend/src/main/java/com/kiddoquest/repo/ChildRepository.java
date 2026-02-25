package com.kiddoquest.repo;

import com.kiddoquest.domain.Child;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChildRepository extends JpaRepository<Child, Long> {
  Optional<Child> findByLoginAccount(String loginAccount);
  boolean existsByLoginAccount(String loginAccount);
  List<Child> findAllByParent_Id(Long parentId);
  Optional<Child> findByIdAndParent_Id(Long id, Long parentId);
}

