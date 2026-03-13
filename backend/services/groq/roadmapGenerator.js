const { groqJSON } = require('./client');
const { searchYouTubeCourses } = require('../youtube/scraper');

const FREE_RESOURCES = {
  general: ['roadmap.sh', 'MDN Web Docs', 'freeCodeCamp', 'The Odin Project', 'CS50'],
  devops:  ['KodeKloud free', 'Play with Docker', 'Killer Koda'],
  ml:      ['fast.ai', 'Kaggle Learn', 'Google ML Crash Course'],
  backend: ['The Odin Project', 'FullStackOpen', 'freeCodeCamp'],
  frontend:['Scrimba', 'freeCodeCamp', 'CSS Tricks'],
};

async function generateSkillRoadmap({ skill, candidateLevel = 'beginner', targetLevel = 'intermediate', weeklyHours = 10 }) {

  const roadmap = await groqJSON(
    `You are a senior engineering mentor creating a highly practical, project-based learning roadmap.
    Prioritize free resources. Be specific about what to build each week.
    Include checkpoints so the learner knows when they're ready to move on.`,

    `Create a 4-week learning roadmap for: "${skill}"
Current level: ${candidateLevel}
Target level: ${targetLevel}  
Weekly available hours: ${weeklyHours}

Return JSON:
{
  skill: "${skill}",
  total_weeks: 4,
  total_hours: number,
  weekly_hours: ${weeklyHours},
  overview: "2-sentence overview of what they will learn",
  weeks: [
    {
      week: 1,
      theme: "short theme name",
      goal: "specific, measurable goal",
      topics: ["topic1", "topic2", "topic3"],
      resources: [
        {
          title: "resource title",
          url: "real URL",
          type: "article"|"video"|"course"|"interactive"|"project",
          estimated_hours: number,
          is_free: true,
          priority: "essential"|"optional"
        }
      ],
      mini_project: "specific project to build this week",
      milestone: "how to know you completed this week"
    }
  ],
  practice_projects: [
    { name: "project name", description: "short desc", difficulty: "beginner"|"intermediate"|"advanced", estimated_hours: number }
  ],
  interview_prep: ["top 5 interview questions for this skill"],
  common_mistakes: ["mistake 1", "mistake 2"],
  next_skill_after: "what to learn next after mastering this"
}`
  );

  // Fetch real YouTube videos for each week's topics
  const ytResults = await searchYouTubeCourses(skill, 8).catch(() => []);

  roadmap.weeks = roadmap.weeks.map((week, i) => ({
    ...week,
    youtube_videos: ytResults.slice(i * 2, i * 2 + 2)
  }));
  roadmap.all_youtube_resources = ytResults;

  return roadmap;
}

module.exports = { generateSkillRoadmap };
