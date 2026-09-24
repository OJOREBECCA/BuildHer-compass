function buildPrompt(profile, opportunity, notes) {
  const name = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'the applicant';
  const links = ['linkedin', 'portfolio', 'github']
    .filter((k) => profile?.[k])
    .map((k) => `${k}: ${profile[k]}`)
    .join(', ');

  return `You are helping ${name}, an African woman in tech, write a first-draft personal statement / short cover letter for a real opportunity she found on BuildHer Compass. Write in first person, in her voice — warm, specific, and confident, never generic or filled with empty buzzwords. 250-350 words. Plain prose only: no markdown headers, no bullet lists, no placeholders like "[insert]".

Only use facts given below about the applicant — do not invent experience, job titles, achievements, or credentials she hasn't stated. If her stated career stage is "Student" or "Recent Graduate", write as someone early in their career, not as an established professional. If her country doesn't match a country the opportunity targets, don't claim she is from that country — focus on why she's a strong candidate regardless of geography.

APPLICANT
- Career stage: ${profile?.stage || 'not specified'} (${profile?.level || 'not specified'} level)
- Country: ${profile?.country || 'not specified'}${profile?.city ? `, ${profile.city}` : ''}
- Interests: ${profile?.interests?.join(', ') || 'not specified'}
${links ? `- Links: ${links}` : ''}
${notes ? `- She specifically wants this draft to emphasize: ${notes}` : ''}

OPPORTUNITY
- Title: ${opportunity.title}
- Organization: ${opportunity.org}
- Category: ${opportunity.category}
- Description: ${opportunity.description}
- Eligibility: ${opportunity.eligibility?.map((e) => e.label).join('; ') || 'not specified'}

Write only the draft text itself, ready to paste into an application form.`;
}

function templateDraft(profile, opportunity, notes) {
  const name = profile?.firstName || 'I';
  const stage = profile?.stage ? profile.stage.toLowerCase() : 'someone building a career in tech';
  const interest = profile?.interests?.[0] || 'technology';
  const emphasis = notes ? ` I'd also like to highlight ${notes}.` : '';

  return `Dear ${opportunity.org} Selection Committee,

My name is ${profile?.firstName ? `${profile.firstName} ${profile?.lastName || ''}`.trim() : 'I am an applicant'}, and I am excited to apply for ${opportunity.title}. As ${stage} based in ${profile?.country || 'Africa'} with a strong interest in ${interest}, this opportunity aligns closely with where I want to grow next.

${opportunity.description.slice(0, 240)}${opportunity.description.length > 240 ? '…' : ''} This is exactly the kind of challenge I want to take on. I bring curiosity, consistency, and a track record of following through on what I start — qualities I believe matter as much as technical skill.${emphasis}

I would welcome the opportunity to bring my energy and perspective to ${opportunity.org}, and to grow alongside a community that invests in people like me. Thank you for considering my application.

Sincerely,
${name}

[This is a template draft — add a Gemini API key to backend/.env for a fully AI-generated version tailored to this opportunity.]`;
}

module.exports = { buildPrompt, templateDraft };
