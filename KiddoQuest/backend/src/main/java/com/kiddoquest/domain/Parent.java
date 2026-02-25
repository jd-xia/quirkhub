package com.kiddoquest.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "parent")
public class Parent {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "login_account", nullable = false, unique = true, length = 64)
  private String loginAccount;

  @Column(name = "password_hash", nullable = false, length = 120)
  private String passwordHash;

  @Column(name = "display_name", nullable = false, length = 64)
  private String displayName;

  @Column(name = "create_time", nullable = false)
  private Instant createTime;
}

