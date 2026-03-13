const router = require('express').Router();
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { scrapeLinkedInProfile } = require('../services/linkedin/scraper');
const { parseLinkedInData } = require('../services/linkedin/parser');

router.post('/import', authenticate, async (req, res) => {
  const { linkedin_url } = req.body;

  if (!linkedin_url || !linkedin_url.includes('linkedin.com/in/')) {
    return res.status(400).json({ error: 'Invalid LinkedIn URL. Must be a linkedin.com/in/ profile URL.' });
  }

  try {
    const scrapeResult = await scrapeLinkedInProfile(linkedin_url);
    if (!scrapeResult.success) {
      return res.status(422).json({
        error: 'Could not scrape this LinkedIn profile. Make sure it is a PUBLIC profile.',
        details: scrapeResult.error
      });
    }

    const parsed = await parseLinkedInData(scrapeResult.data);

    const checks = [
      parsed.name, parsed.headline, parsed.summary,
      parsed.skills?.length > 0, parsed.experience?.length > 0,
      parsed.education?.length > 0
    ];
    const completeness = Math.round(checks.filter(Boolean).length / checks.length * 100);
    parsed.completeness_score = completeness;

    await supabase.from('candidate_profiles').upsert({
      user_id: req.user.id,
      linkedin_url,
      linkedin_data: scrapeResult.data,
      parsed_data: parsed,
      completeness_score: completeness,
      updated_at: new Date()
    }, { onConflict: 'user_id' });

    res.json({ parsed, completeness, linkedin_url });

  } catch (err) {
    console.error('LinkedIn import error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/refresh', authenticate, async (req, res) => {
  const { data: profile } = await supabase.from('candidate_profiles')
    .select('linkedin_url').eq('user_id', req.user.id).single();

  if (!profile?.linkedin_url) {
    return res.status(400).json({ error: 'No LinkedIn URL saved. Import first.' });
  }

  const scrapeResult = await scrapeLinkedInProfile(profile.linkedin_url);
  if (!scrapeResult.success) return res.status(422).json({ error: scrapeResult.error });
  const parsed = await parseLinkedInData(scrapeResult.data);

  await supabase.from('candidate_profiles').update({
    linkedin_data: scrapeResult.data, parsed_data: parsed, updated_at: new Date()
  }).eq('user_id', req.user.id);

  res.json({ parsed, refreshed: true });
});

module.exports = router;
