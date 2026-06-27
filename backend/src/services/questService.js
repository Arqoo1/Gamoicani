export function getGeorgianDateKey(date = new Date()) {
  // Georgian time is UTC+4
  const georgianTime = new Date(date.getTime() + 4 * 60 * 60 * 1000);
  return georgianTime.toISOString().split("T")[0];
}

function getRandomQuests() {
  const questPool = [
    { type: "play_any", title: "ითამაშე ნებისმიერი", targets: [2, 3] },
    { type: "win_any", title: "მოიგე ნებისმიერი", targets: [1, 2] },
    { type: "play_wordle", title: "ითამაშე სიტყვობანა", targets: [1] },
    { type: "win_wordle", title: "მოიგე სიტყვობანა", targets: [1] },
    { type: "play_andazebi", title: "ითამაშე ანდაზები", targets: [1] },
    { type: "play_trivia", title: "ითამაშე ვიქტორინა", targets: [1] }
  ];

  // Shuffle and pick 3
  const shuffled = [...questPool].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);

  return selected.map((q, index) => {
    const target = q.targets[Math.floor(Math.random() * q.targets.length)];
    return {
      id: `quest_${index}`,
      type: q.type,
      target,
      progress: 0,
      completed: false,
      title: `${q.title} ${target > 1 ? `${target}-ჯერ` : ""}`.trim()
    };
  });
}

export function ensureDailyQuests(user, now = new Date()) {
  const dateKey = getGeorgianDateKey(now);

  if (!user.dailyQuests || user.dailyQuests.dateKey !== dateKey) {
    user.dailyQuests = {
      dateKey,
      quests: getRandomQuests(),
      bonusClaimed: false
    };
  }

  return user;
}

export function evaluateQuests(user, scoreEvent) {
  if (!user.dailyQuests || !user.dailyQuests.quests || user.dailyQuests.bonusClaimed) {
    return user;
  }

  let allCompleted = true;

  for (const quest of user.dailyQuests.quests) {
    if (quest.completed) {
      continue;
    }

    let increment = 0;
    
    // Evaluate if the current scoreEvent contributes to this quest
    switch (quest.type) {
      case "play_any":
        increment = 1;
        break;
      case "win_any":
        if (scoreEvent.won) increment = 1;
        break;
      case "play_wordle":
        if (scoreEvent.gameId === "wordle") increment = 1;
        break;
      case "win_wordle":
        if (scoreEvent.gameId === "wordle" && scoreEvent.won) increment = 1;
        break;
      case "play_andazebi":
        if (scoreEvent.gameId === "andazebi") increment = 1;
        break;
      case "play_trivia":
        if (scoreEvent.gameId === "trivia") increment = 1;
        break;
    }

    if (increment > 0) {
      quest.progress = Math.min(quest.target, quest.progress + increment);
      if (quest.progress >= quest.target) {
        quest.completed = true;
      }
    }

    if (!quest.completed) {
      allCompleted = false;
    }
  }

  if (allCompleted && !user.dailyQuests.bonusClaimed) {
    user.dailyQuests.bonusClaimed = true;
    user.totalPoints += 3;
  }

  return user;
}
