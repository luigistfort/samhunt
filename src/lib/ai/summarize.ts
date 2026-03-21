// src/lib/ai/summarize.ts
// AI-powered opportunity summarization and fit analysis

import OpenAI from 'openai';
import type { AIOpportunitySummary, EnrichedOpportunity, BusinessProfile } from '@/types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Explain Opportunity ──────────────────────────────────────────────────────

export async function explainOpportunity(
  opp: EnrichedOpportunity
): Promise<AIOpportunitySummary> {
  const prompt = buildExplainPrompt(opp);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a government contracting expert. Summarize contract opportunities in plain English for small business owners who are not procurement experts. Be concise, practical, and honest about complexity.',
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

// ─── Is This a Good Fit ───────────────────────────────────────────────────────

export async function analyzeOpportunityFit(
  opp: EnrichedOpportunity,
  profile: BusinessProfile
): Promise<AIOpportunitySummary> {
  const prompt = buildFitPrompt(opp, profile);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a government contracting business development expert. Analyze whether a contract opportunity is a good fit for a specific small business. Give an honest, data-driven assessment with a fit score and actionable next steps.',
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

// ─── Prompt Builders ──────────────────────────────────────────────────────────

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
  "keyRequirements": ["requirement 1", "requirement 2", ...],  // 3-6 key things they're looking for
  "risks": ["risk 1", "risk 2", ...],  // 2-4 potential challenges
  "estimatedValue": "string if discernible from description, else null",
  "nextSteps": ["step 1", "step 2", ...]  // 3-4 concrete next steps to pursue this
}`;
}

function buildFitPrompt(opp: EnrichedOpportunity, profile: BusinessProfile): string {
  return `Analyze whether this contract opportunity is a good fit for this business:

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
Description: ${opp.description?.slice(0, 1500) ?? 'No description provided'}

BUSINESS PROFILE:
Company: ${profile.companyName ?? 'Unknown'}
Description: ${profile.description ?? 'No description provided'}
NAICS Codes: ${profile.naicsCodes.join(', ') || 'None specified'}
Certifications: ${profile.certifications.join(', ') || 'None'}
Preferred States: ${profile.preferredStates.join(', ') || 'No preference'}
Target Agencies: ${profile.targetAgencies.join(', ') || 'No preference'}
Contract Size Range: ${
  profile.minContractSize || profile.maxContractSize
    ? `$${(profile.minContractSize ?? 0).toLocaleString()} - $${(profile.maxContractSize ?? 0).toLocaleString()}`
    : 'No preference'
}

Respond with this JSON structure:
{
  "summary": "2-3 sentence overall assessment of fit",
  "fitScore": 0-100,  // Honest score: 80+ = strong fit, 50-79 = possible fit, below 50 = poor fit
  "fitReasons": ["reason 1", ...],  // 3-5 specific reasons for the score
  "keyRequirements": ["requirement 1", ...],  // Top 3-5 requirements from the opportunity
  "risks": ["risk 1", ...],  // 2-4 specific risks given THIS business profile
  "nextSteps": ["step 1", ...]  // 3-5 concrete next steps if they want to pursue
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
