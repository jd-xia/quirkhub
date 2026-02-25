package com.kiddoquest.repo;

import com.kiddoquest.domain.Parent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ParentRepository extends JpaRepository<Parent, Long> {
  Optional<Parent> findByLoginAccount(String loginAccount);
  boolean existsByLoginAccount(String loginAccount);
}

