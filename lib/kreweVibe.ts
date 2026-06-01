"use client";

import { supabase } from "./supabase/client";

export type KreweAnswerType = "short_answer" | "long_answer" | "single_choice" | "multi_choice" | "optional";

export type KreweQuestion = {
  id: string;
  question_key: string;
  question_text: string;
  category: string;
  is_public: boolean;
  is_active: boolean;
  display_order: number;
  answer_type: KreweAnswerType;
  options: string[];
  section: string;
  helper_text?: string;
  required: boolean;
};

type QuestionConfig = Omit<KreweQuestion, "id" | "is_active">;

export const KREWE_QUESTION_CONFIG: Record<string, QuestionConfig> = {
  why_join: {
    question_key: "why_join",
    question_text: "Why do you want to join Les Bi Gulf Friends?",
    category: "community_values",
    is_public: true,
    display_order: 10,
    answer_type: "long_answer",
    options: [],
    section: "Community Values",
    helper_text: "Think friendship, community, events, belonging, and meaningful social connection.",
    required: true,
  },
  social_energy: {
    question_key: "social_energy",
    question_text: "Which best describes the kind of energy you bring into social spaces?",
    category: "communication_style",
    is_public: true,
    display_order: 20,
    answer_type: "multi_choice",
    options: [
      "Warm and welcoming",
      "Funny and playful",
      "Calm and thoughtful",
      "Organized and dependable",
      "Protective of friends",
      "Creative and expressive",
      "I mostly observe until comfortable",
    ],
    section: "Community Values",
    helper_text: "Choose everything that feels true. Balanced answers are welcome.",
    required: true,
  },
  community_meaning: {
    question_key: "community_meaning",
    question_text: "What does “community” mean to you?",
    category: "community_values",
    is_public: true,
    display_order: 30,
    answer_type: "long_answer",
    options: [],
    section: "Community Values",
    helper_text: "Mutual support, showing up, respect, inclusion, accountability, kindness.",
    required: true,
  },
  rsvp_cannot_attend: {
    question_key: "rsvp_cannot_attend",
    question_text: "If you RSVP “Going” to an event but can’t make it, what do you usually do?",
    category: "reliability",
    is_public: false,
    display_order: 40,
    answer_type: "single_choice",
    options: [
      "Let the organizer know as soon as possible",
      "Quietly disappear",
      "Decide last minute without telling anyone",
      "It depends",
    ],
    section: "Reliability & Social Maturity",
    required: true,
  },
  conflict_with_members: {
    question_key: "conflict_with_members",
    question_text: "How do you usually handle conflict with friends or group members?",
    category: "conflict_style",
    is_public: false,
    display_order: 50,
    answer_type: "long_answer",
    options: [],
    section: "Reliability & Social Maturity",
    helper_text: "Healthy answers usually include calm discussion, boundaries, de-escalation, and accountability.",
    required: true,
  },
  removed_or_banned: {
    question_key: "removed_or_banned",
    question_text: "Have you ever been removed or banned from an online group, organization, or social community?",
    category: "accountability",
    is_public: false,
    display_order: 60,
    answer_type: "long_answer",
    options: [],
    section: "Reliability & Social Maturity",
    helper_text: "This is not automatically disqualifying. Honesty, accountability, and growth matter.",
    required: true,
  },
  event_priority: {
    question_key: "event_priority",
    question_text: "Which of these feels most important at a group event?",
    category: "community_values",
    is_public: true,
    display_order: 70,
    answer_type: "single_choice",
    options: [
      "Making everyone feel included",
      "Being the center of attention",
      "Taking the best photos",
      "Winning arguments",
      "Finding gossip",
    ],
    section: "Manners & Emotional Intelligence",
    required: true,
  },
  new_member_nervous: {
    question_key: "new_member_nervous",
    question_text: "A new member arrives alone and looks nervous. What would you most likely do?",
    category: "social_generosity",
    is_public: false,
    display_order: 80,
    answer_type: "single_choice",
    options: [
      "Introduce yourself and help them feel welcome",
      "Wait for them to approach you",
      "Ignore them",
      "Judge whether they seem “cool enough”",
    ],
    section: "Manners & Emotional Intelligence",
    required: true,
  },
  behavior_ruins_community: {
    question_key: "behavior_ruins_community",
    question_text: "What kind of behavior ruins a community?",
    category: "community_values",
    is_public: false,
    display_order: 90,
    answer_type: "long_answer",
    options: [],
    section: "Manners & Emotional Intelligence",
    helper_text: "Strong answers often mention cruelty, cliques, manipulation, disrespect, dishonesty, harassment, or chronic negativity.",
    required: true,
  },
  digital_privacy: {
    question_key: "digital_privacy",
    question_text: "Which statement do you agree with most?",
    category: "privacy",
    is_public: false,
    display_order: 100,
    answer_type: "single_choice",
    options: [
      "Private conversations should stay private",
      "Screenshots are fine if I’m upset",
      "Public callouts solve most problems",
      "Social media drama is entertaining",
    ],
    section: "Digital Etiquette",
    required: true,
  },
  emotional_confidence: {
    question_key: "emotional_confidence",
    question_text: "If another member confides in you emotionally, what is your responsibility?",
    category: "privacy",
    is_public: false,
    display_order: 110,
    answer_type: "long_answer",
    options: [],
    section: "Digital Etiquette",
    helper_text: "Discretion, empathy, boundaries, and support without gossip.",
    required: true,
  },
  ideal_gathering: {
    question_key: "ideal_gathering",
    question_text: "Which sounds most like your ideal gathering?",
    category: "event_preferences",
    is_public: true,
    display_order: 120,
    answer_type: "single_choice",
    options: [
      "A relaxed beach bonfire with good conversation",
      "A chaotic night of fighting and gossip",
      "A networking opportunity only",
      "A place to compete socially",
    ],
    section: "Krewe Culture Fit",
    required: true,
  },
  rules_moderators: {
    question_key: "rules_moderators",
    question_text: "How do you feel about group rules and moderators?",
    category: "moderation_fit",
    is_public: false,
    display_order: 130,
    answer_type: "long_answer",
    options: [],
    section: "Krewe Culture Fit",
    helper_text: "Healthy answers recognize safety, fairness, boundaries, and the need for moderation.",
    required: true,
  },
  classy_meaning: {
    question_key: "classy_meaning",
    question_text: "What makes someone “classy” to you?",
    category: "community_values",
    is_public: true,
    display_order: 140,
    answer_type: "long_answer",
    options: [],
    section: "Krewe Culture Fit",
    helper_text: "We are looking for kindness, humility, reliability, consideration, emotional control, and generosity.",
    required: true,
  },
  scenario_spilled_drink: {
    question_key: "scenario_spilled_drink",
    question_text: "Scenario: At an event, someone accidentally spills a drink on you. What do you do?",
    category: "scenario_conflict",
    is_public: false,
    display_order: 150,
    answer_type: "long_answer",
    options: [],
    section: "Scenario Questions",
    helper_text: "Good signs: grace, humor, calm communication.",
    required: true,
  },
  scenario_pick_side: {
    question_key: "scenario_pick_side",
    question_text: "Scenario: You learn that two members are privately arguing and one asks you to “pick a side.” How do you respond?",
    category: "scenario_conflict",
    is_public: false,
    display_order: 160,
    answer_type: "long_answer",
    options: [],
    section: "Scenario Questions",
    helper_text: "Healthy answers avoid fueling conflict and encourage direct communication unless safety is involved.",
    required: true,
  },
  scenario_photo_dislike: {
    question_key: "scenario_photo_dislike",
    question_text: "Scenario: Someone posts a photo of you from an event that you dislike. What do you do?",
    category: "scenario_privacy",
    is_public: false,
    display_order: 170,
    answer_type: "long_answer",
    options: [],
    section: "Scenario Questions",
    helper_text: "Good answers include respectful communication and asking for removal.",
    required: true,
  },
  contribution: {
    question_key: "contribution",
    question_text: "What are you hoping to contribute to this community?",
    category: "community_values",
    is_public: true,
    display_order: 180,
    answer_type: "long_answer",
    options: [],
    section: "Final Vibe Check",
    required: true,
  },
  anything_else: {
    question_key: "anything_else",
    question_text: "Is there anything else you’d like us to know about you?",
    category: "optional",
    is_public: true,
    display_order: 190,
    answer_type: "optional",
    options: [],
    section: "Final Vibe Check",
    required: false,
  },
};

export function requiredKreweQuestionKeys() {
  return Object.values(KREWE_QUESTION_CONFIG).filter((q) => q.required).map((q) => q.question_key);
}

function mergeQuestionConfig(row: any): KreweQuestion {
  const config = KREWE_QUESTION_CONFIG[row.question_key] || {
    question_key: row.question_key,
    question_text: row.question_text,
    category: row.category,
    is_public: row.is_public,
    display_order: row.display_order,
    answer_type: "long_answer",
    options: [],
    section: "Krewe Vibe",
    required: true,
  };

  return {
    id: row.id,
    question_key: row.question_key,
    question_text: row.question_text || config.question_text,
    category: row.category || config.category,
    is_public: row.is_public ?? config.is_public,
    is_active: row.is_active ?? true,
    display_order: row.display_order ?? config.display_order,
    answer_type: config.answer_type,
    options: config.options || [],
    section: config.section,
    helper_text: config.helper_text,
    required: config.required,
  };
}

export async function listKreweQuestions() {
  const { data, error } = await supabase
    .from("member_questions")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) throw error;

  return (data || []).map(mergeQuestionConfig);
}

export async function listMyKreweAnswers(userId: string) {
  const { data, error } = await supabase
    .from("member_answers")
    .select("*, question:member_questions(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    ...row,
    question: row.question ? mergeQuestionConfig(row.question) : null,
  }));
}

export async function listPublicKreweAnswers(userId: string) {
  const { data, error } = await supabase
    .from("member_answers")
    .select("*, question:member_questions(*)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data || [])
    .filter((row: any) => row.question?.is_public && row.question?.is_active)
    .map((row: any) => ({
      ...row,
      question: row.question ? mergeQuestionConfig(row.question) : null,
    }));
}

export async function saveKreweAnswer(args: {
  userId: string;
  questionId: string;
  answerText?: string | null;
  answerValue?: any;
}) {
  const { error } = await supabase.from("member_answers").upsert(
    {
      user_id: args.userId,
      question_id: args.questionId,
      answer_text: args.answerText ?? null,
      answer_value: args.answerValue ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,question_id" }
  );

  if (error) throw error;
}

export async function getKreweCompletionStatus(userId: string) {
  const answers = await listMyKreweAnswers(userId).catch(() => []);
  const required = new Set(requiredKreweQuestionKeys());
  const answered = new Set<string>();

  for (const answer of answers as any[]) {
    const key = answer.question?.question_key;
    if (!required.has(key)) continue;

    const display = answerDisplay(answer).trim();
    if (display) answered.add(key);
  }

  return {
    answeredCount: answered.size,
    requiredCount: required.size,
    complete: answered.size >= required.size,
  };
}

export function answerDisplay(answer: any) {
  const value = answer?.answer_value;

  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  if (answer?.answer_text) return answer.answer_text;
  if (value && typeof value === "object") return Object.values(value).join(", ");

  return "";
}

function valueTokens(answer: any): string[] {
  const text = answerDisplay(answer).toLowerCase();
  const values = Array.isArray(answer?.answer_value)
    ? answer.answer_value.map((x: any) => String(x).toLowerCase())
    : [text];

  return [...values, text]
    .flatMap((item) => String(item).split(/[^a-z0-9]+/i))
    .map((item) => item.trim())
    .filter((item) => item.length > 2);
}

const COMMUNITY_KEYWORDS = [
  "friendship",
  "community",
  "belonging",
  "support",
  "respect",
  "kindness",
  "reliable",
  "reliability",
  "showing",
  "inclusion",
  "inclusive",
  "accountability",
  "humility",
  "generosity",
  "boundaries",
];

const EVENT_KEYWORDS = [
  "beach",
  "bonfire",
  "conversation",
  "dinner",
  "brunch",
  "music",
  "mardi",
  "gras",
  "game",
  "volunteer",
  "coffee",
  "relaxed",
];

const COMMUNICATION_KEYWORDS = [
  "warm",
  "welcoming",
  "funny",
  "playful",
  "calm",
  "thoughtful",
  "organized",
  "dependable",
  "protective",
  "creative",
  "observe",
  "comfortable",
  "direct",
  "communication",
];

const RED_FLAG_KEYWORDS = [
  "drama",
  "revenge",
  "gossip",
  "hate",
  "hookup",
  "hookups",
  "attention",
  "callout",
  "callouts",
  "screenshots",
  "upset",
  "humiliate",
  "rage",
  "retaliate",
  "smear",
  "compete",
  "fighting",
  "never my fault",
  "not my fault",
  "mods are power hungry",
  "rules are stupid",
];

function keywordHits(answer: any, keywords: string[]) {
  const display = answerDisplay(answer).toLowerCase();
  const tokens = new Set(valueTokens(answer));
  return keywords.filter((keyword) => display.includes(keyword) || tokens.has(keyword));
}

function privacyConflictRedFlags(answers: any[]) {
  let count = 0;

  for (const answer of answers) {
    const key = answer.question?.question_key || "";
    if (!["conflict_with_members", "removed_or_banned", "digital_privacy", "scenario_spilled_drink", "scenario_pick_side", "scenario_photo_dislike", "rules_moderators", "ideal_gathering"].includes(key)) {
      continue;
    }

    const display = answerDisplay(answer).toLowerCase();
    if (RED_FLAG_KEYWORDS.some((keyword) => display.includes(keyword))) count += 1;
  }

  return count;
}

function sharedKeywordScore(myAnswers: any[], theirAnswers: any[], category: "community" | "events" | "communication" | "interests") {
  const keywords =
    category === "community"
      ? COMMUNITY_KEYWORDS
      : category === "events"
        ? EVENT_KEYWORDS
        : category === "communication"
          ? COMMUNICATION_KEYWORDS
          : [];

  const mine = new Set(myAnswers.flatMap((answer) => keywordHits(answer, keywords)));
  const theirs = new Set(theirAnswers.flatMap((answer) => keywordHits(answer, keywords)));

  return [...mine].filter((token) => theirs.has(token));
}

export async function listKreweFriendSuggestions(userId: string) {
  const [myAnswers, profileRes] = await Promise.all([
    listMyKreweAnswers(userId),
    supabase
      .from("profiles")
      .select("id, display_name, photo_url, photo_urls, bio, interests, karma_points, membership_status, is_banned")
      .neq("id", userId)
      .eq("is_banned", false)
      .limit(200),
  ]);

  if (profileRes.error) throw profileRes.error;

  const profiles = (profileRes.data || []).filter((profile: any) => {
    const status = String(profile.membership_status || "active").toLowerCase();
    return status !== "removed" && status !== "banned";
  });

  if (!profiles.length) return [];

  const candidateIds = profiles.map((profile: any) => profile.id);

  const { data: candidateAnswers, error: answerError } = await supabase
    .from("member_answers")
    .select("*, question:member_questions(*)")
    .in("user_id", candidateIds);

  if (answerError) throw answerError;

  const byUser = new Map<string, any[]>();

  for (const raw of candidateAnswers || []) {
    const answer = { ...raw, question: raw.question ? mergeQuestionConfig(raw.question) : null };
    byUser.set(answer.user_id, [...(byUser.get(answer.user_id) || []), answer]);
  }

  const myInterests = new Set(((profiles.find((p: any) => p.id === userId)?.interests || []) as string[]).map((x) => x.toLowerCase()));

  return profiles
    .map((profile: any) => {
      const theirAnswers = byUser.get(profile.id) || [];
      let score = 0;
      const reasons: string[] = [];

      const community = sharedKeywordScore(myAnswers, theirAnswers, "community");
      if (community.length) {
        score += Math.min(community.length, 3) * 3;
        reasons.push(`Shared community values: ${community.slice(0, 3).join(", ")}`);
      }

      const events = sharedKeywordScore(myAnswers, theirAnswers, "events");
      if (events.length) {
        score += Math.min(events.length, 2) * 2;
        reasons.push(`Shared event preferences: ${events.slice(0, 2).join(", ")}`);
      }

      const communication = sharedKeywordScore(myAnswers, theirAnswers, "communication");
      if (communication.length) {
        score += Math.min(communication.length, 2) * 2;
        reasons.push(`Compatible communication style: ${communication.slice(0, 2).join(", ")}`);
      }

      const theirInterests = new Set(((profile.interests || []) as string[]).map((x) => String(x).toLowerCase()));
      const sharedInterests = [...myInterests].filter((item) => theirInterests.has(item));
      if (sharedInterests.length) {
        score += Math.min(sharedInterests.length, 5);
        reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(", ")}`);
      }

      const redFlags = privacyConflictRedFlags(myAnswers) + privacyConflictRedFlags(theirAnswers);
      if (redFlags > 0) score -= redFlags * 5;

      return {
        profile,
        score,
        reasons: reasons.slice(0, 4),
      };
    })
    .filter((row: any) => row.score > 0)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 20);
}
