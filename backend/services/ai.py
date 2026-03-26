import json
import re
import httpx
from models import QuickReadResult, FullAnalysisResult, FullAnalysisRequest
from config import settings
from logger import get_logger

log = get_logger(__name__)

OPENAI_URL = "https://api.openai.com/v1/chat/completions"

QUICK_READ_PROMPT = """You are a sharp, experienced business analyst.
A user describes a business idea. Your job:
1. Give an instant honest read: title, one-sentence summary, viability score.
2. Generate follow-up questions to gather context for a precise full analysis.

VIABILITY SCORE RULES:
- 1-2: not a real idea (too vague, nonsense, single words, "make money"); illegal (gambling, drugs, weapons); technically impossible for a solo founder; dominated by incumbents with no viable niche
- 3-4: very high capital or regulatory barrier, not bootstrappable, needs a team or millions
- 5-6: hard but doable, real risks, needs strong execution
- 7-8: viable, good market fit, realistic path to revenue
- 9-10: exceptional opportunity, low competition, fast path to cash
DO NOT default to 7. Score based on the actual idea.

IMPORTANT: If the input is not a business idea (vague, single word, gibberish), set viability_score to 1, title to "Not a Business Idea", explain in summary, and return empty questions array.

QUESTION RULES:
- Generate 2-4 questions SPECIFIC to this idea
- Mix types: "choice" (2-4 options) for bounded answers, "text" for open answers
- question ids must be short slugs (e.g. "target_market", "existing_network")
- DO NOT ask about budget or time — those are asked separately

Return ONLY valid JSON, no markdown:
{
  "title": "2-4 word name",
  "summary": "One honest sentence.",
  "viability_score": <integer 1-10>,
  "questions": [
    {"id": "slug", "text": "Question?", "type": "choice", "choices": ["A", "B", "C"]},
    {"id": "slug2", "text": "Question?", "type": "text", "choices": null}
  ]
}"""




FULL_ANALYSIS_PROMPT = """You are a brutally honest senior business analyst with 20 years of experience killing bad ideas early.
A user has described a business idea and answered follow-up questions.
Produce a complete, realistic business analysis using ALL context provided. Never be vague. Never be generic.

═══════════════════════════════
HARD RULES (never violate these)
═══════════════════════════════

[BUDGET]
- "< EUR 1k" = hard ceiling of EUR 1000
- "EUR 1-5k" = hard ceiling of EUR 5000
- "EUR 5-20k" = hard ceiling of EUR 20000
- "EUR 20k+" = uncapped
- investment.max MUST NOT exceed the user's budget ceiling.
- If the idea structurally requires more capital than available: drop viability_score by 2, add an explicit warning in summary, and redesign the plan around no-code/manual/scrappy alternatives (Bubble, Glide, Notion, manual ops, waitlist MVP). If it truly cannot be done at that budget, say so plainly.
- Typical investment ranges by category:
    SaaS/software: EUR 2k–20k
    Physical product: EUR 20k–200k+
    Marketplace: EUR 15k–80k
    Food/logistics: EUR 30k–150k
    Deep tech: EUR 500k+

[TIME]
- If user has < 1h/day available: multiply ALL milestone durations by 2.5x minimum.
- If user has 1-2h/day: multiply by 1.5x.
- Reflect this in every "when" field and in first_customer / break_even / amortize.

[NUMBERS]
- Every figure (investment, revenue, timeline) must be derived from THIS specific idea and THIS user's answers. No generic benchmarks.
- revenue.month_3 CAN and SHOULD be 0 if realistic. Do not invent traction.
- Revenue estimates must account for realistic conversion rates, sales cycle length, and price point stated or implied.

[VIABILITY SCORE]
- Start from a neutral 5. Adjust based on: market size, competition, budget fit, founder time, regulatory exposure, unit economics.
- A score of 7+ requires clear evidence. A score of 3 or below requires an explanation in summary.

═══════════════════════════════
FIELD-SPECIFIC RULES
═══════════════════════════════

[title]
- Refined, specific version of the idea. Not a slogan. Max 8 words.

[summary]
- 3-5 sentences. Must mention: what the business actually does, the core risk, the budget/time fit verdict.
- If budget or time is a red flag, the first sentence must say so explicitly.

[viability_score]
- Integer 1–10. See scoring rules above.

[business_plan]
- Minimum 5 steps, maximum 10. Use as many as the complexity of this idea requires.
- Each step must reference the actual product, actual channel, and actual constraints of this user.
- No generic steps like "build MVP" or "find customers". Be specific: "Build a Bubble.io prototype of the booking flow targeting freelance architects in Milan via cold LinkedIn outreach."

[roadmap]
- Minimum 3 milestones, maximum 8. Generate as many as realistically needed — do not pad, do not compress.
- Each milestone must be a concrete, measurable deliverable (not "grow the business").
- "when" must reflect the user's actual time availability (see TIME rules above).
- Milestones must be sequential and causally linked — each one unlocks the next.

[investment]
- min and max are integers in EUR.
- breakdown must list specific cost drivers (e.g. "Bubble.io plan EUR 30/mo, freelance designer EUR 800, ad spend EUR 500, legal EUR 300").
- Must not exceed budget ceiling unless flagged in summary.

[revenue]
- month_3, month_6, month_12 are integers in EUR.
- All three must be independently justified by price × realistic volume.
- If month_3 is 0, month_6 must still be honest — do not compensate with an inflated number.

[timeline]
- first_customer: realistic timeframe to paying customer #1 (not a beta user, not a waitlister).
- break_even: month when cumulative revenue ≥ cumulative costs.
- amortize: month when initial investment is fully recovered.
- All three must be consistent with roadmap and revenue projections.

[contacts_needed]
- Minimum 1, maximum 5. Only include roles that are genuinely blocking without them.
- "where" must be a specific, actionable place (e.g. "LinkedIn groups for independent pharmacists in Italy", not "LinkedIn").
- Do not include generic advisors or investors unless the idea structurally requires them at this stage.

[problems]
- Minimum 3, maximum 6. Each must be specific to THIS idea — no generic startup risks.
- Cover at least: one competitor/market risk, one unit economics or pricing risk, one operational or legal risk.
- mitigation: concrete action the founder can take now or soon.
- contingency: what the pivot or exit looks like if the risk materializes.

═══════════════════════════════
OUTPUT
═══════════════════════════════
Return ONLY valid JSON. No markdown. No commentary. No keys outside this schema.

{
  "title": "string (max 8 words)",
  "summary": "string (3-5 sentences, flags budget/time issues first if any)",
  "viability_score": <integer 1-10>,
  "business_plan": [
    "specific step 1",
    "specific step 2"
    // 5–10 steps total
  ],
  "roadmap": [
    {"milestone": "concrete deliverable", "when": "adjusted timeframe"}
    // 3–8 milestones, as many as needed
  ],
  "investment": {
    "min": <int EUR>,
    "max": <int EUR>,
    "currency": "EUR",
    "breakdown": "itemized cost drivers"
  },
  "revenue": {
    "month_3": <int EUR>,
    "month_6": <int EUR>,
    "month_12": <int EUR>,
    "currency": "EUR"
  },
  "timeline": {
    "first_customer": "string",
    "break_even": "string",
    "amortize": "string"
  },
  "contacts_needed": [
    {"role": "string", "why": "specific reason", "where": "specific actionable place"}
    // 1–5 contacts
  ],
  "problems": [
    {"title": "string", "description": "string", "mitigation": "string", "contingency": "string"}
    // 3–6 problems
  ]
}"""

CHAT_SYSTEM_PROMPT = """You are a business advisor helping a user develop and refine their business idea.
You have full context about their idea, analysis, and previous conversation.
Be direct, specific, and honest. Reference the actual numbers and details from their analysis.
If they ask to change something about the plan, suggest specific modifications.
Keep responses concise — 2-4 sentences unless a detailed answer is truly needed."""


def _extract_json(raw: str) -> dict:
    cleaned = re.sub(r"```json|```", "", raw).strip()
    return json.loads(cleaned)


async def _call_openai(system: str, user: str) -> str:
    payload = {
        "model": settings.openai_model,
        "max_tokens": settings.openai_max_tokens,
        "temperature": 0.7,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openai_api_key}",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OPENAI_URL, json=payload, headers=headers)
    if response.status_code != 200:
        log.error("OpenAI error: %s %s", response.status_code, response.text)
        raise RuntimeError(f"OpenAI API returned {response.status_code}")
    return response.json()["choices"][0]["message"]["content"]


async def quick_read(idea: str) -> QuickReadResult:
    log.info("Quick read (length=%d)", len(idea))
    raw = await _call_openai(QUICK_READ_PROMPT, f"Business idea: {idea}")
    result = QuickReadResult(**_extract_json(raw))
    log.info("Quick read done: title=%r viability=%d", result.title, result.viability_score)
    return result


async def full_analysis(req: FullAnalysisRequest) -> FullAnalysisResult:
    log.info("Full analysis (length=%d)", len(req.idea))
    answers_block = "\n".join([
        f"- Hours per day available: {req.hours_per_day}",
        f"- Available budget: {req.budget}",
        *[f"- {k}: {v}" for k, v in req.answers.items()],
    ])
    user_msg = f"Business idea: {req.idea}\n\nUser context:\n{answers_block}"
    raw = await _call_openai(FULL_ANALYSIS_PROMPT, user_msg)
    result = FullAnalysisResult(**_extract_json(raw))
    log.info("Full analysis done: title=%r viability=%d", result.title, result.viability_score)
    return result


async def chat_response(
    idea_context: dict,
    history: list[dict],
    user_message: str,
) -> str:
    log.info("Chat response for idea=%s", idea_context.get("title"))

    context_block = (
        f"IDEA: {idea_context['title']}\n"
        f"SUMMARY: {idea_context['summary']}\n"
        f"VIABILITY: {idea_context['viability_score']}/10\n"
        f"ORIGINAL PROMPT: {idea_context['original_prompt']}"
    )
    system = f"{CHAT_SYSTEM_PROMPT}\n\nIDEA CONTEXT:\n{context_block}"

    messages = [{"role": "system", "content": system}]
    for msg in history[-20:]:  # last 20 messages as context window
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    payload = {
        "model": settings.openai_model,
        "max_tokens": 600,
        "temperature": 0.7,
        "messages": messages,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.openai_api_key}",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(OPENAI_URL, json=payload, headers=headers)
    if response.status_code != 200:
        raise RuntimeError(f"OpenAI API returned {response.status_code}")
    return response.json()["choices"][0]["message"]["content"]