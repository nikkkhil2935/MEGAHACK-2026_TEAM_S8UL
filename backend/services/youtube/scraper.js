const axios = require('axios');

const YT_BASE = 'https://www.googleapis.com/youtube/v3';
const API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Search YouTube for free learning resources for a skill.
 * Returns top 8 videos sorted by relevance.
 */
async function searchYouTubeCourses(skill, maxResults = 8) {
  const queries = [
    `${skill} tutorial for beginners 2024`,
    `${skill} complete course free`,
    `${skill} crash course`,
  ];

  const allVideos = [];

  for (const q of queries.slice(0, 2)) {
    const { data } = await axios.get(`${YT_BASE}/search`, {
      params: {
        part:       'snippet',
        q,
        type:       'video',
        maxResults: 5,
        videoDuration: 'medium',
        videoDefinition: 'high',
        key: API_KEY,
      }
    }).catch(() => ({ data: { items: [] } }));

    allVideos.push(...(data.items || []).map(item => ({
      video_id:     item.id.videoId,
      title:        item.snippet.title,
      channel:      item.snippet.channelTitle,
      description:  item.snippet.description?.slice(0, 200),
      thumbnail:    item.snippet.thumbnails?.medium?.url,
      url:          `https://www.youtube.com/watch?v=${item.id.videoId}`,
      published_at: item.snippet.publishedAt,
    })));
  }

  // Deduplicate by video_id
  const seen = new Set();
  return allVideos.filter(v => {
    if (seen.has(v.video_id)) return false;
    seen.add(v.video_id);
    return true;
  }).slice(0, maxResults);
}

/**
 * Get video statistics (views, likes) for a list of video IDs.
 */
async function getVideoStats(videoIds) {
  if (!videoIds.length) return [];
  const { data } = await axios.get(`${YT_BASE}/videos`, {
    params: { part: 'statistics,contentDetails', id: videoIds.join(','), key: API_KEY }
  }).catch(() => ({ data: { items: [] } }));

  return data.items || [];
}

module.exports = { searchYouTubeCourses, getVideoStats };
