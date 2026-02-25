package com.kiddoquest.security;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "kiddoquest.jwt")
public class JwtProperties {
  private String issuer;
  private String secret;
  private long accessTokenMinutes;
}

