package com.kiddoquest.repo;

import com.kiddoquest.domain.PlayTimeLog;
import com.kiddoquest.domain.PlayTimeChangeType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PlayTimeLogRepository extends JpaRepository<PlayTimeLog, Long> {
  Optional<PlayTimeLog> findTop1ByChild_IdOrderByCreateTimeDesc(long childId);
  List<PlayTimeLog> findTop50ByChild_IdOrderByCreateTimeDesc(long childId);

  long countByChild_IdAndChangeTypeAndCreateTimeBetween(long childId, PlayTimeChangeType changeType, Instant start, Instant end);
}

