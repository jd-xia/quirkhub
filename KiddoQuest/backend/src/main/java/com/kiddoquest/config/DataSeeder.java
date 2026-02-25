package com.kiddoquest.config;

import com.kiddoquest.api.dto.TemplateCreateRequest;
import com.kiddoquest.api.dto.TemplateItemDto;
import com.kiddoquest.domain.Child;
import com.kiddoquest.domain.DimensionCategory;
import com.kiddoquest.domain.Parent;
import com.kiddoquest.domain.ScoreType;
import com.kiddoquest.domain.ShopItem;
import com.kiddoquest.domain.ShopItemStatus;
import com.kiddoquest.repo.ChildRepository;
import com.kiddoquest.repo.ParentRepository;
import com.kiddoquest.repo.ShopItemRepository;
import com.kiddoquest.repo.TemplateRepository;
import com.kiddoquest.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataSeeder {
  private final PasswordEncoder passwordEncoder;

  @Bean
  public CommandLineRunner seed(
      ParentRepository parentRepository,
      ChildRepository childRepository,
      ShopItemRepository shopItemRepository,
      TemplateRepository templateRepository,
      TemplateService templateService
  ) {
    return args -> {
      Parent parent;
      if (!parentRepository.existsByLoginAccount("parent")) {
        parent = Parent.builder()
            .loginAccount("parent")
            .passwordHash(passwordEncoder.encode("parent123"))
            .displayName("家长")
            .createTime(Instant.now())
            .build();
        parentRepository.save(parent);

        Child c = Child.builder()
            .parent(parent)
            .name("小朋友")
            .loginAccount("kid")
            .passwordHash(passwordEncoder.encode("kid123"))
            .avatar(null)
            .createTime(Instant.now())
            .build();
        childRepository.save(c);
      } else {
        parent = parentRepository.findByLoginAccount("parent").orElseThrow();
      }

      // demo shop items
      if (shopItemRepository.findAllByParent_IdAndStatusOrderByUpdateTimeDesc(parent.getId(), ShopItemStatus.ACTIVE).isEmpty()) {
        Instant now = Instant.now();
        ShopItem i1 = ShopItem.builder()
            .parent(parent)
            .child(null)
            .name("贴纸盲盒（1 个）")
            .description("可爱贴纸随机掉落！")
            .costPoints(5)
            .stock(null)
            .icon("🎁")
            .status(ShopItemStatus.ACTIVE)
            .createTime(now)
            .updateTime(now)
            .build();
        ShopItem i2 = ShopItem.builder()
            .parent(parent)
            .child(null)
            .name("周末电影票（1 次）")
            .description("和爸爸妈妈一起看电影！")
            .costPoints(30)
            .stock(2)
            .icon("🎬")
            .status(ShopItemStatus.ACTIVE)
            .createTime(now)
            .updateTime(now)
            .build();
        ShopItem i3 = ShopItem.builder()
            .parent(parent)
            .child(null)
            .name("加 30 分钟玩耍时间")
            .description("周末额外玩耍 30 分钟。")
            .costPoints(15)
            .stock(null)
            .icon("⏰")
            .status(ShopItemStatus.ACTIVE)
            .createTime(now)
            .updateTime(now)
            .build();
        shopItemRepository.saveAll(List.of(i1, i2, i3));
      }

      String defaultTemplateName = "默认模板";
      if (!templateRepository.existsByCreatedByAndName(parent.getId(), defaultTemplateName)) {
        templateService.create(parent.getId(),
            new TemplateCreateRequest(
                defaultTemplateName,
                "学习习惯 / 生活习惯 / 加分项 / 扣分项",
                10,
                List.of(
                  new TemplateItemDto(DimensionCategory.LEARNING, "认真完成课内作业", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LEARNING, "认真完成课外作业", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LEARNING, "每天阅读书籍20分钟", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LEARNING, "大声朗读10分钟", null, 1, ScoreType.FULL),
                  
                  new TemplateItemDto(DimensionCategory.LIFE, "按时起床，自己叠被子、穿衣服并完成洗漱", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "准时就寝，20:00后不使用电子产品", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "认真整理个人物品，并放回原位", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "认真吃饭，不挑食，不剩饭，不浪费", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "每天向爸爸妈妈分享当天计划和经历", null, 2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "晚餐时与爸爸妈妈复盘当天学习内容及计划执行情况", null, 2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "每天坚持在自己的课桌上学习", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.LIFE, "每次学习20分钟后进行2分钟远眺休息", null, 2, ScoreType.FULL),
                  
                  new TemplateItemDto(DimensionCategory.BONUS, "复盘检查时认真修正错误题目", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "主动与爸爸妈妈规划使用iPad时间", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "发现爸爸妈妈使用手机时主动提醒", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "被大人提问时，无论是否在忙，给出清楚明确的回答", null, 1, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "积极参与爸爸妈妈安排的户外活动或洗车", null, 2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "周末或假期外出时，弟弟必须紧跟爸爸，姐姐协助监督", null, 2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "每日好词好句练习（弟弟会读，姐姐会写）", null, 2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.BONUS, "帮助弟弟新牙齿健康，姐姐协助监督", null, 2, ScoreType.FULL),
                  
                  new TemplateItemDto(DimensionCategory.PENALTY, "说谎或打人", null, -2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.PENALTY, "在公共场合大声喧哗", null, -2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.PENALTY, "乱发脾气且不讲道理", null, -2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.PENALTY, "被爸爸妈妈抓到偷偷看手机", null, -2, ScoreType.FULL),
                  new TemplateItemDto(DimensionCategory.PENALTY, "被扣分后，在爸爸妈妈解释事实的情况下哭闹", null, -2, ScoreType.FULL)
                )
            )
        );
      }

      // Child-friendly presets (samples)
      String sample1 = "样板·幼儿园轻量";
      if (!templateRepository.existsByCreatedByAndName(parent.getId(), sample1)) {
        templateService.create(parent.getId(),
            new TemplateCreateRequest(
                sample1,
                "更少维度、更轻松：适合幼儿园/低年级起步。",
                6,
                List.of(
                    new TemplateItemDto(DimensionCategory.LEARNING, "阅读/听读 10 分钟", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "自己穿衣、洗漱、整理书包", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "按时睡觉（睡前不看屏幕）", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "认真吃饭，不浪费", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.BONUS, "主动帮忙做一件家务（擦桌子/收玩具）", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.PENALTY, "发脾气/顶嘴", null, -2, ScoreType.FULL)
                )
            )
        );
      }

      String sample2 = "样板·小学自律";
      if (!templateRepository.existsByCreatedByAndName(parent.getId(), sample2)) {
        templateService.create(parent.getId(),
            new TemplateCreateRequest(
                sample2,
                "强调作业与自律：适合小学阶段。",
                10,
                List.of(
                    new TemplateItemDto(DimensionCategory.LEARNING, "按计划完成课内作业", null, 2, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LEARNING, "课外练习/错题订正", null, 2, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LEARNING, "朗读 10 分钟", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LEARNING, "阅读 20 分钟", null, 2, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "运动/户外 30 分钟", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "桌面整理，物品归位", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.BONUS, "主动规划屏幕时间并遵守", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.PENALTY, "偷看手机/平板", null, -2, ScoreType.FULL)
                )
            )
        );
      }

      String sample3 = "样板·周末挑战";
      if (!templateRepository.existsByCreatedByAndName(parent.getId(), sample3)) {
        templateService.create(parent.getId(),
            new TemplateCreateRequest(
                sample3,
                "周末/假期：更多家务、户外与亲子共同行动。",
                8,
                List.of(
                    new TemplateItemDto(DimensionCategory.LEARNING, "复习一周知识点（10~20分钟）", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "家务挑战（扫地/洗碗/整理）", null, 2, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.LIFE, "户外活动（散步/骑行/运动）", null, 2, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.BONUS, "主动帮助家人/照顾弟弟妹妹", null, 2, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.BONUS, "外出遵守约定（不乱跑/不吵闹）", null, 1, ScoreType.FULL),
                    new TemplateItemDto(DimensionCategory.PENALTY, "公共场合大声喧哗/不守规则", null, -2, ScoreType.FULL)
                )
            )
        );
      }
    };
  }
}

