package com.kiddoquest.api;

import com.kiddoquest.api.dto.GameDictationSubmitRequest;
import com.kiddoquest.api.dto.GameEssaySubmitRequest;
import com.kiddoquest.api.dto.GameSubmitRewardResponse;
import com.kiddoquest.security.Authz;
import com.kiddoquest.service.GamesService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/games")
@RequiredArgsConstructor
public class GamesController {
  private final GamesService gamesService;

  @PostMapping("/essay/submit")
  public ResponseEntity<GameSubmitRewardResponse> submitEssay(Authentication authentication, @Valid @RequestBody GameEssaySubmitRequest req) {
    var c = Authz.requireChild(authentication);
    return ResponseEntity.ok(gamesService.submitEssay(c.userId(), req));
  }

  @PostMapping("/dictation/submit")
  public ResponseEntity<GameSubmitRewardResponse> submitDictation(Authentication authentication, @Valid @RequestBody GameDictationSubmitRequest req) {
    var c = Authz.requireChild(authentication);
    return ResponseEntity.ok(gamesService.submitDictation(c.userId(), req));
  }
}

