package com.kiddoquest.repo;

import com.kiddoquest.domain.WeeklyScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface WeeklyScoreRepository extends JpaRepository<WeeklyScore, Long> {
  List<WeeklyScore> findAllByChild_Id(long childId);
  Optional<WeeklyScore> findByIdAndChild_Id(long id, long childId);
  Optional<WeeklyScore> findByChild_IdAndWeekStartDate(long childId, LocalDate weekStartDate);
  List<WeeklyScore> findAllByChild_IdAndWeekStartDate(long childId, LocalDate weekStartDate);

  List<WeeklyScore> findAllByChild_IdAndWeekStartDateGreaterThanEqualOrderByWeekStartDateAsc(long childId, LocalDate weekStartDate);
}

