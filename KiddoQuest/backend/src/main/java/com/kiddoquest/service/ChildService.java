package com.kiddoquest.service;

import com.kiddoquest.api.ForbiddenException;
import com.kiddoquest.api.dto.ChildCreateRequest;
import com.kiddoquest.api.dto.ChildResponse;
import com.kiddoquest.api.dto.ChildUpdateRequest;
import com.kiddoquest.domain.Child;
import com.kiddoquest.domain.Parent;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.ParentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ChildService {
  private final ChildRepository childRepository;
  private final ParentRepository parentRepository;
  private final PasswordEncoder passwordEncoder;

  @Transactional(readOnly = true)
  public List<ChildResponse> listByParent(long parentId) {
    return childRepository.findAllByParent_Id(parentId).stream().map(this::toResponse).toList();
  }

  @Transactional
  public ChildResponse create(long parentId, ChildCreateRequest req) {
    if (childRepository.existsByLoginAccount(req.loginAccount().trim())) {
      throw new IllegalArgumentException("loginAccount already exists");
    }
    Parent p = parentRepository.findById(parentId).orElseThrow(() -> new ForbiddenException("Parent not found"));
    Child c = Child.builder()
        .parent(p)
        .name(req.name().trim())
        .loginAccount(req.loginAccount().trim())
        .passwordHash(passwordEncoder.encode(req.password()))
        .avatar(req.avatar())
        .createTime(Instant.now())
        .build();
    childRepository.save(c);
    return toResponse(c);
  }

  @Transactional
  public ChildResponse update(long parentId, long childId, ChildUpdateRequest req) {
    Child c = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));

    if (req.name() != null) {
      c.setName(req.name().trim());
    }
    if (req.avatar() != null) {
      c.setAvatar(req.avatar());
    }
    if (req.password() != null && !req.password().isBlank()) {
      c.setPasswordHash(passwordEncoder.encode(req.password()));
    }
    return toResponse(c);
  }

  @Transactional
  public void delete(long parentId, long childId) {
    Child c = childRepository.findByIdAndParent_Id(childId, parentId)
        .orElseThrow(() -> new ForbiddenException("Child not found"));
    childRepository.delete(c);
  }

  private ChildResponse toResponse(Child c) {
    return new ChildResponse(
        c.getId(),
        c.getName(),
        c.getLoginAccount(),
        c.getAvatar(),
        c.getParent().getId(),
        c.getCreateTime()
    );
  }
}

