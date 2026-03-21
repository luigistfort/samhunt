// src/lib/ai/summarize.ts
import type { AIOpportunitySummary, EnrichedOpportunity, BusinessProfile } from '@/types';

function getOpenAI() {
  const { default: OpenAI } = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function explainOpportunity(
  opp: EnrichedOpportunity
): Promise<AIOpportunitySummary> {
  const openai = getOpenAI();
  const prompt = buildExplainPrompt(opp);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a government contracting expert. Summarize contract opportunities in plain English for small business owners. Be concise and practical.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content ?? '{}';
  return parseAiResponse(content);
}

export async function analyzeOpportunityFit(
  opp: EnrichedOpportunity,
  profile: BusinessProfile
): Promise<AIOpportunitySummary> {
  const openai = getOpenAI();
  const prompt = buildFitPrompt(opp, profile);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a government contracting business development expert. Analyze whether a contract opportunity is a good fit for a specific small business.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 1000,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content ?? '{}';
  return parseAiResponse(content);
}

function buildExplainPrompt(opp: EnrichedOpportunity): string {
  return `Analyze this government contract opportunity and respond with JSON:

OPPORTUNITY:
Title: ${opp.title}
Agency: ${opp.agencyName ?? opp.fullParentPathName ?? 'Unknown'}
Notice Type: ${opp.type}
NAICS: ${opp.naicsCode ?? 'Not specified'}
Set-Aside: ${opp.setAsideLabel ?? opp.typeOfSetAsideDescription ?? 'Full and Open Competition'}
Posted: ${opp.postedDate}
Deadline: ${opp.responseDeadLine ?? 'Not specified'}
Days Until Deadline: ${opp.daysUntilDeadline ?? 'Unknown'}
Place of Performance: ${opp.placeOfPerformance ?? 'Not specified'}
Description: ${opp.description?.slice(0, 2000) ?? 'No description provided'}

Respond with this JSON structure:
{
  "summary": "2-3 sentences explaining what this opportunity is for in plain English",
  "keyRequirements": ["requirement 1", "requirement 2"],
  "risks": ["risk 1", "risk 2"],
  "estimatedValue": "string if discernible, else null",
  "nextSteps": ["step 1", "step 2"]
}`;
}

function buildFitPrompt(opp: EnrichedOpportunity, profile: BusinessProfile): string {
  return `Analyze whether this contract opportunity is a good fit for this business:

OPPORTUNITY:
Title: ${opp.title}
Agency: ${opp.agencyName ?? 'Unknown'}
Notice Type: ${opp.type}
NAICS: ${opp.naicsCode ?? 'Not specified'}
Set-Aside: ${opp.setAsideLabel ?? 'Full and Open Competition'}
Deadline: ${opp.responseDeadLine ?? 'Not specified'}
Days Until Deadline: ${opp.daysUntilDeadline ?? 'Unknown'}
Description: ${opp.description?.slice(0, 1500) ?? 'No description provided'}

BUSINESS PROFILE:
Company: ${profile.companyName ?? 'Unknown'}
Description: ${profile.description ?? 'No description provided'}
NAICS Codes: ${profile.naicsCodes.join(', ') || 'None specified'}
Certifications: ${profile.certifications.join(', ') || 'None'}
Preferred States: ${profile.preferredStates.join(', ') || 'No preference'}

Respond with this JSON structure:
{
  "summary": "2-3 sentence overall assessment of fit",
  "fitScore": 0,
  "fitReasons": ["reason 1"],
  "keyRequirements": ["requirement 1"],
  "risks": ["risk 1"],
  "nextSteps": ["step 1"]
}`;
}

function parseAiResponse(content: string): AIOpportunitySummary {
  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary ?? 'Unable to generate summary.',
      keyRequirements: parsed.keyRequirements ?? [],
      risks: parsed.risks ?? [],
      fitScore: parsed.fitScore,
      fitReasons: parsed.fitReasons,
      nextSteps: parsed.nextSteps ?? [],
      estimatedValue: parsed.estimatedValue,
    };
  } catch {
    return {
      summary: 'Unable to parse AI response.',
      keyRequirements: [],
      risks: [],
      nextSteps: [],
    };
  }
}
