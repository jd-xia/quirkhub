package com.kiddoquest.repo;

import com.kiddoquest.domain.DimensionCategory;
import com.kiddoquest.domain.WeeklyScoreItem;
import com.kiddoquest.domain.WeeklyScoreStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface WeeklyScoreItemRepository extends JpaRepository<WeeklyScoreItem, Long> {
  List<WeeklyScoreItem> findAllByWeeklyScore_Id(long weeklyScoreId);
  List<WeeklyScoreItem> findAllByWeeklyScore_IdOrderByDimensionNameAscDayOfWeekAsc(long weeklyScoreId);

  interface ItemTotalRow {
    DimensionCategory getCategory();
    String getDimensionName();
    Integer getTotalScore();
  }

  @Query("""
      select i.dimensionCategory as category, i.dimensionName as dimensionName, sum(i.score) as totalScore
      from WeeklyScoreItem i
      join i.weeklyScore ws
      where ws.child.id = :childId
        and ws.status in :statuses
      group by i.dimensionCategory, i.dimensionName
      order by sum(i.score) desc, i.dimensionName asc
      """)
  List<ItemTotalRow> sumItemTotalsByChild(@Param("childId") long childId, @Param("statuses") List<WeeklyScoreStatus> statuses);
}

