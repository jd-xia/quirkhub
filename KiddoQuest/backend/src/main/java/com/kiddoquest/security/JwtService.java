package com.kiddoquest.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class JwtService {
  private final JwtProperties props;

  private SecretKey key() {
    return Keys.hmacShaKeyFor(Decoders.BASE64.decode(props.getSecret()));
  }

  public String issueAccessToken(AuthPrincipal principal) {
    Instant now = Instant.now();
    Instant exp = now.plus(props.getAccessTokenMinutes(), ChronoUnit.MINUTES);

    return Jwts.builder()
        .issuer(props.getIssuer())
        .subject(principal.subject())
        .issuedAt(Date.from(now))
        .expiration(Date.from(exp))
        .claims(Map.of(
            "role", principal.role().name(),
            "uid", principal.userId()
        ))
        .signWith(key(), Jwts.SIG.HS256)
        .compact();
  }

  public AuthPrincipal parse(String token) {
    Claims c = Jwts.parser()
        .verifyWith(key())
        .requireIssuer(props.getIssuer())
        .build()
        .parseSignedClaims(token)
        .getPayload();

    String sub = c.getSubject();
    String roleStr = c.get("role", String.class);
    Number uid = c.get("uid", Number.class);
    if (sub == null || roleStr == null || uid == null) {
      throw new IllegalArgumentException("Invalid token claims");
    }
    return new AuthPrincipal(uid.longValue(), Role.valueOf(roleStr), sub);
  }
}

