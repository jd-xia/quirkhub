package com.kiddoquest.repo;

import com.kiddoquest.domain.PointsChangeType;
import com.kiddoquest.domain.PointsLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PointsLogRepository extends JpaRepository<PointsLog, Long> {
  List<PointsLog> findTop50ByChild_IdOrderByCreateTimeDesc(long childId);
  Optional<PointsLog> findTop1ByChild_IdOrderByCreateTimeDesc(long childId);
  boolean existsByChild_IdAndChangeTypeAndRelatedId(long childId, PointsChangeType changeType, long relatedId);
  List<PointsLog> findAllByChild_IdAndChangeTypeAndRelatedId(long childId, PointsChangeType changeType, long relatedId);

  List<PointsLog> findAllByChild_IdAndCreateTimeAfterOrderByCreateTimeDesc(long childId, Instant after);

  List<PointsLog> findAllByChild_IdOrderByCreateTimeAsc(long childId);
}

