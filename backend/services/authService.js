const supabase = require('../../db/supabase');
const { ROLES } = require('../../constants');

/**
 * Create or get user profile
 * Handles profile creation with proper ON CONFLICT handling to prevent race conditions
 */
async function createOrGetUserProfile(userId, email, full_name, role = ROLES.CANDIDATE, company_name = null) {
  // Use Supabase upsert to atomically handle concurrent creates
  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, full_name, role }, { onConflict: 'id' })
    .select()
    .single();

  if (error) throw error;

  // Create role-specific profile tables in parallel
  const roleProfileInserts = [];

  if (role === ROLES.CANDIDATE) {
    roleProfileInserts.push(
      supabase.from('candidate_profiles').upsert({ user_id: userId }, { onConflict: 'user_id' })
    );
  } else if (role === ROLES.RECRUITER) {
    roleProfileInserts.push(
      supabase.from('recruiter_profiles').upsert({ user_id: userId, company_name }, { onConflict: 'user_id' })
    );
  }

  // Execute all inserts in parallel
  if (roleProfileInserts.length > 0) {
    await Promise.all(roleProfileInserts);
  }

  return profile;
}

/**
 * Extract display name from user metadata or email
 */
function extractDisplayName(authUser) {
  return authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User';
}

/**
 * Generate JWT token for authenticated session
 */
function generateAuthToken(userId) {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

module.exports = {
  createOrGetUserProfile,
  extractDisplayName,
  generateAuthToken
};
