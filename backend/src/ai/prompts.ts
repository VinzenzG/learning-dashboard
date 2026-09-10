export function buildQuestionPrompt(text: string, unitTitle: string, count: number): string {
  return `You are an expert educator creating learning questions from educational slides.

Unit title: "${unitTitle}"

Slide content:
---
${text}
---

Generate exactly ${count} diverse quiz questions based on this content.
Detect the language of the content and generate questions in THE SAME LANGUAGE.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "question_type": "mc",
    "question_text": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option A",
    "explanation": "Because...",
    "topic_tag": "Topic Name",
    "difficulty": 3
  }
]

Rules:
- question_type must be one of: mc, truefalse, fillin, shortanswer, feynman
- For "mc": provide exactly 4 options, correct_answer must match one option exactly
- For "truefalse": options must be ["True", "False"] (or translated), correct_answer is one of them
- For "fillin": question_text contains ___ where the answer goes, options is null
- For "shortanswer": open question, options is null, correct_answer is a concise answer
- For "feynman": ask to explain a concept in simple terms, options is null
- difficulty: integer 1-5 (1=easy, 5=hard)
- topic_tag: short descriptive topic name (2-4 words) in the content's language
- explanation: always provide a clear explanation (2-3 sentences) why the answer is correct
- Vary question types across the ${count} questions
- Make questions test understanding, not just memorization
- topic_tag values should be consistent for the same topic across questions`;
}

export function buildSummaryPrompt(text: string, moduleName: string): string {
  return `You are an expert educator. Create a concise 1-page summary of the following learning material.

Module: "${moduleName}"

Content:
---
${text}
---

Write a clear summary in the SAME LANGUAGE as the content. Structure it with:
- A short overview paragraph
- Key concepts as bullet points grouped by topic
- 3-5 "Important to remember" takeaways at the end

Use markdown formatting (##, ###, -, **bold**). Be concise but comprehensive. Max 600 words.`;
}

export function buildDeepenPrompt(text: string, unitTitle: string, topicTag: string, count: number): string {
  return `You are an expert educator creating additional practice questions for a specific topic.

Unit: "${unitTitle}"
Focus topic: "${topicTag}"

Content:
---
${text}
---

Generate exactly ${count} additional quiz questions that SPECIFICALLY test understanding of "${topicTag}".
Detect the language of the content and generate questions in THE SAME LANGUAGE.
Include harder questions (difficulty 4-5) to challenge the learner.

Return ONLY a valid JSON array (same schema as before):
[{"question_type":"mc","question_text":"...","options":["A","B","C","D"],"correct_answer":"A","explanation":"...","topic_tag":"${topicTag}","difficulty":4}]

Rules:
- question_type: mc | truefalse | fillin | shortanswer | feynman
- For mc: exactly 4 options, correct_answer matches one exactly
- For truefalse: options=["True","False"] (or language equivalent)
- topic_tag must be "${topicTag}" for all questions
- Make questions harder than average — focus on application and analysis`;
}

export function buildFeynmanEvalPrompt(question: string, userAnswer: string): string {
  return `You are an expert educator evaluating a student's explanation using the Feynman technique.

Question: "${question}"
Student's answer: "${userAnswer}"

Evaluate the explanation and return ONLY valid JSON (no markdown):
{
  "score": 4,
  "feedback": "Your explanation...",
  "correct_points": ["Point 1", "Point 2"],
  "missing_points": ["Missing point 1"]
}

Rules:
- score: integer 1-5 (1=very poor, 3=adequate, 5=excellent)
- feedback: 2-3 sentences of constructive feedback in the same language as the student's answer
- correct_points: array of things the student got right (can be empty)
- missing_points: array of important concepts missing or incorrect (can be empty)
- Be encouraging but honest`;
}
