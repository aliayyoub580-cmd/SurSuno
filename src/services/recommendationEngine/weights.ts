import type { InteractionWeights, InteractionType } from './types';

export const DEFAULT_INTERACTION_WEIGHTS: InteractionWeights = {
  play: 1,
  partialPlay: 2,
  completion: 4,
  replay: 5,
  like: 8,
  save: 9,
  playlistAdd: 10,
  share: 7,
  artistFollow: 8,
  dislike: -10,
  quickSkip: -5,
};

let currentWeights: InteractionWeights = { ...DEFAULT_INTERACTION_WEIGHTS };

export function getInteractionWeights(): InteractionWeights {
  return currentWeights;
}

export function updateInteractionWeights(newWeights: Partial<InteractionWeights>): void {
  currentWeights = { ...currentWeights, ...newWeights };
}

/**
  * Calculate completion signal bonus/penalty based on listening completion rate:
  * < 10% → strong negative (-5)
  * 10–30% → weak negative (-2)
  * 30–70% → neutral (0)
  * 70–95% → positive (+2)
  * > 95% → strong positive (+4)
  */
export function getCompletionRateBonus(completionRate: number): number {
  if (completionRate < 0.10) return -5;
  if (completionRate < 0.30) return -2;
  if (completionRate < 0.70) return 0;
  if (completionRate <= 0.95) return 2;
  return 4;
}

/**
  * Time decay function:
  * recencyWeight = exp(-daysSinceInteraction / 30)
  */
export function calculateRecencyWeight(daysSinceInteraction: number): number {
  const safeDays = Math.max(0, daysSinceInteraction);
  return Math.exp(-safeDays / 30);
}

/**
  * Calculate net effective interaction score combining interaction weight, completion rate bonus, and time decay.
  */
export function calculateNetInteractionScore(
  interactionType: InteractionType,
  completionRate = 1.0,
  daysSinceInteraction = 0
): number {
  const weights = getInteractionWeights();
  const baseWeight = weights[interactionType] ?? 1;
  const completionBonus = interactionType === 'play' || interactionType === 'completion'
    ? getCompletionRateBonus(completionRate)
    : 0;

  const rawScore = baseWeight + completionBonus;
  const recency = calculateRecencyWeight(daysSinceInteraction);

  return rawScore * recency;
}
