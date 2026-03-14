const router = require('express').Router();
const multer = require('multer');
const supabase = require('../db/supabase');
const { authenticate } = require('../middleware/auth');
const { parseResume, abTestResumes } = require('../services/groq/resumeParser');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10_000_000 } });

// Upload and parse resume
router.post('/upload', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const parsed = await parseResume(req.file.buffer, req.file.mimetype);

    // Upload to Supabase Storage
    const fileName = `${req.user.id}_${Date.now()}.pdf`;
    await supabase.storage.from('resumes').upload(fileName, req.file.buffer, {
      contentType: req.file.mimetype
    });
    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(fileName);

    await supabase.from('candidate_profiles').upsert({
      user_id: req.user.id,
      raw_text: parsed.raw_text,
      parsed_data: parsed,
      resume_url: urlData.publicUrl,
      completeness_score: parsed.completeness_score,
      updated_at: new Date()
    }, { onConflict: 'user_id' });

    res.json({ parsed, resume_url: urlData.publicUrl });
  } catch (err) {
    console.error('Resume parse error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get parsed profile
router.get('/parsed', authenticate, async (req, res) => {
  try {
    const { data } = await supabase.from('candidate_profiles')
      .select('*').eq('user_id', req.user.id).maybeSingle();
    res.json(data || null);
  } catch (err) {
    res.json(null);
  }
});

// Update parsed data (manual edits)
router.put('/update', authenticate, async (req, res) => {
  const { parsed_data } = req.body;
  await supabase.from('candidate_profiles').update({
    parsed_data, updated_at: new Date()
  }).eq('user_id', req.user.id);
  res.json({ updated: true });
});

// Get completeness score + tips
router.get('/completeness', authenticate, async (req, res) => {
  const { data } = await supabase.from('candidate_profiles')
    .select('parsed_data, completeness_score').eq('user_id', req.user.id).maybeSingle();

  const tips = [];
  const p = data?.parsed_data || {};
  if (!p.summary) tips.push('Add a professional summary');
  if (!p.skills?.length) tips.push('Add your technical skills');
  if (!p.projects?.length) tips.push('Add at least one project');
  if (!p.linkedin && !p.github) tips.push('Add LinkedIn or GitHub link');

  res.json({ completeness: data?.completeness_score || 0, tips });
});

// A/B Test two resumes
router.post('/ab-test', authenticate, upload.fields([
  { name: 'resume_a', maxCount: 1 },
  { name: 'resume_b', maxCount: 1 }
]), async (req, res) => {
  const fileA = req.files?.resume_a?.[0];
  const fileB = req.files?.resume_b?.[0];
  const { job_description } = req.body;

  if (!fileA || !fileB || !job_description) {
    return res.status(400).json({ error: 'Need two resumes and a job description' });
  }

  try {
    const result = await abTestResumes(
      fileA.buffer, fileA.mimetype,
      fileB.buffer, fileB.mimetype,
      job_description
    );
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
