import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, MapPin, Briefcase } from 'lucide-react'
import api from '../services/api'

const FALLBACK_JOBS = [
  { id: 'mock-1', title: 'Senior React Developer', company: 'TechVista Solutions', location: 'Bangalore, India', remote_policy: 'hybrid', job_category: 'Frontend', match_score: 92, salary_range: '₹18L - ₹28L', experience: '3-5 years', description: 'Build and maintain complex React applications with TypeScript. Lead frontend architecture decisions, mentor junior developers, and collaborate with design and backend teams. Experience with state management (Redux/Zustand), testing (Jest/RTL), and CI/CD pipelines required.', required_skills: ['React', 'TypeScript', 'Redux', 'Jest', 'CI/CD', 'REST APIs'], recruiter: { name: 'Priya Sharma', email: 'priya@techvista.com' } },
  { id: 'mock-2', title: 'Backend Engineer (Node.js)', company: 'CloudNine Systems', location: 'Mumbai, India', remote_policy: 'remote', job_category: 'Backend', match_score: 85, salary_range: '₹15L - ₹24L', experience: '2-4 years', description: 'Design and develop scalable RESTful APIs and microservices using Node.js and Express. Work with PostgreSQL, Redis, and message queues. Strong understanding of authentication, authorization, and API security best practices.', required_skills: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'REST APIs'], recruiter: { name: 'Rahul Mehta', email: 'rahul@cloudnine.io' } },
  { id: 'mock-3', title: 'Data Scientist', company: 'AnalytiQ Labs', location: 'Hyderabad, India', remote_policy: 'onsite', job_category: 'Data Science', match_score: 78, salary_range: '₹20L - ₹35L', experience: '3-6 years', description: 'Apply statistical modeling and machine learning to solve business problems. Build predictive models, perform A/B testing, and create data visualizations. Experience with Python, scikit-learn, TensorFlow, and SQL required.', required_skills: ['Python', 'scikit-learn', 'TensorFlow', 'SQL', 'Pandas', 'Statistics'], recruiter: { name: 'Ananya Reddy', email: 'ananya@analytiq.com' } },
  { id: 'mock-4', title: 'Full Stack Developer (MERN)', company: 'StartupHub Inc.', location: 'Pune, India', remote_policy: 'remote', job_category: 'Full Stack', match_score: 88, salary_range: '₹12L - ₹22L', experience: '2-4 years', description: 'End-to-end development of web applications using MongoDB, Express, React, and Node.js. Own features from database design to UI implementation. Fast-paced startup environment with ownership and growth opportunities.', required_skills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'Git'], recruiter: { name: 'Vikram Patel', email: 'vikram@startuphub.in' } },
  { id: 'mock-5', title: 'DevOps Engineer', company: 'InfraScale Technologies', location: 'Chennai, India', remote_policy: 'hybrid', job_category: 'DevOps', match_score: 71, salary_range: '₹16L - ₹26L', experience: '3-5 years', description: 'Manage cloud infrastructure on AWS/GCP, build CI/CD pipelines, and implement Infrastructure as Code. Monitor system health, optimize performance, and ensure 99.9% uptime for production services.', required_skills: ['AWS', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'Linux'], recruiter: { name: 'Karthik Iyer', email: 'karthik@infrascale.dev' } },
  { id: 'mock-6', title: 'ML Engineer', company: 'NeuralPath AI', location: 'Bangalore, India', remote_policy: 'remote', job_category: 'AI/ML', match_score: 82, salary_range: '₹22L - ₹40L', experience: '3-6 years', description: 'Design, train, and deploy ML models at scale. Work on NLP, computer vision, and recommendation systems. Strong MLOps skills required — model monitoring, A/B testing, and serving infrastructure.', required_skills: ['Python', 'PyTorch', 'MLOps', 'NLP', 'Docker', 'AWS SageMaker'], recruiter: { name: 'Deepa Nair', email: 'deepa@neuralpath.ai' } },
  { id: 'mock-7', title: 'Product Manager', company: 'GrowthForge', location: 'Delhi NCR, India', remote_policy: 'hybrid', job_category: 'Product', match_score: 65, salary_range: '₹18L - ₹30L', experience: '4-7 years', description: 'Define product strategy, gather requirements, and drive execution. Work closely with engineering, design, and marketing teams. Data-driven decision making with strong user empathy and communication skills.', required_skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research', 'Roadmapping', 'Stakeholder Management'], recruiter: { name: 'Neha Gupta', email: 'neha@growthforge.com' } },
  { id: 'mock-8', title: 'Mobile Developer (React Native)', company: 'AppCraft Studios', location: 'Gurgaon, India', remote_policy: 'onsite', job_category: 'Mobile', match_score: 76, salary_range: '₹14L - ₹22L', experience: '2-4 years', description: 'Build cross-platform mobile apps with React Native. Implement smooth animations, push notifications, and offline-first features. Publish and maintain apps on App Store and Google Play.', required_skills: ['React Native', 'JavaScript', 'iOS', 'Android', 'Redux', 'REST APIs'], recruiter: { name: 'Arjun Singh', email: 'arjun@appcraft.io' } },
  { id: 'mock-9', title: 'Cloud Architect', company: 'SkyBridge Cloud', location: 'Noida, India', remote_policy: 'remote', job_category: 'Cloud', match_score: 69, salary_range: '₹25L - ₹45L', experience: '5-8 years', description: 'Design multi-cloud architectures for enterprise clients. Lead cloud migration projects, implement security best practices, and optimize cloud spend. AWS/Azure/GCP certifications preferred.', required_skills: ['AWS', 'Azure', 'GCP', 'Terraform', 'Security', 'Microservices'], recruiter: { name: 'Sanjay Kumar', email: 'sanjay@skybridge.cloud' } },
  { id: 'mock-10', title: 'UI/UX Designer', company: 'PixelPerfect Design', location: 'Mumbai, India', remote_policy: 'hybrid', job_category: 'Design', match_score: 74, salary_range: '₹10L - ₹20L', experience: '2-5 years', description: 'Create intuitive and beautiful user interfaces for web and mobile products. Conduct user research, build wireframes and prototypes, and collaborate with developers. Proficiency in Figma and design systems required.', required_skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems', 'Adobe XD'], recruiter: { name: 'Meera Joshi', email: 'meera@pixelperfect.design' } },
  { id: 'mock-11', title: 'Data Engineer', company: 'DataFlow Systems', location: 'Pune, India', remote_policy: 'hybrid', job_category: 'Data Science', match_score: 80, salary_range: '₹16L - ₹28L', experience: '3-5 years', description: 'Build and maintain data pipelines, ETL processes, and data warehousing solutions. Work with Apache Spark, Airflow, and cloud data platforms. Ensure data quality and governance across the organization.', required_skills: ['Python', 'SQL', 'Apache Spark', 'Airflow', 'AWS', 'ETL'], recruiter: { name: 'Rohan Das', email: 'rohan@dataflow.io' } },
  { id: 'mock-12', title: 'Cybersecurity Analyst', company: 'SecureNet', location: 'Bangalore, India', remote_policy: 'onsite', job_category: 'Security', match_score: 95, salary_range: '₹14L - ₹25L', experience: '2-5 years', description: 'Monitor and respond to security incidents, perform vulnerability assessments, and implement security controls. Experience with SIEM tools, penetration testing, and compliance frameworks (SOC2, ISO 27001).', required_skills: ['SIEM', 'Penetration Testing', 'Network Security', 'SOC2', 'Python', 'Incident Response'], recruiter: { name: 'Amit Rao', email: 'amit@securenet.in' } },
  { id: 'mock-13', title: 'Game Developer (Unity)', company: 'PlayVibe Studios', location: 'Hyderabad, India', remote_policy: 'remote', job_category: 'Gaming', match_score: 60, salary_range: '₹10L - ₹18L', experience: '2-4 years', description: 'Develop engaging mobile and PC games using Unity and C#. Implement game mechanics, physics, AI behaviors, and multiplayer features. Passion for gaming and understanding of game design principles.', required_skills: ['Unity', 'C#', 'Game Design', '3D Math', 'Physics', 'Multiplayer'], recruiter: { name: 'Ravi Shankar', email: 'ravi@playvibe.games' } },
  { id: 'mock-14', title: 'Scrum Master', company: 'AgileMinds', location: 'Chennai, India', remote_policy: 'hybrid', job_category: 'Management', match_score: 75, salary_range: '₹15L - ₹25L', experience: '3-6 years', description: 'Facilitate Scrum ceremonies, remove impediments, and coach teams on agile best practices. CSM or PSM certification required. Experience with Jira, Confluence, and scaling agile frameworks (SAFe/LeSS).', required_skills: ['Scrum', 'Agile', 'Jira', 'Facilitation', 'SAFe', 'Coaching'], recruiter: { name: 'Sunita Rao', email: 'sunita@agileminds.com' } },
  { id: 'mock-15', title: 'Blockchain Developer', company: 'CryptoCore', location: 'Mumbai, India', remote_policy: 'remote', job_category: 'Blockchain', match_score: 87, salary_range: '₹20L - ₹40L', experience: '2-5 years', description: 'Build smart contracts and decentralized applications on Ethereum and Solana. Experience with Solidity, Web3.js, and DeFi protocols. Strong understanding of cryptography and consensus mechanisms.', required_skills: ['Solidity', 'Web3.js', 'Ethereum', 'Smart Contracts', 'DeFi', 'Cryptography'], recruiter: { name: 'Nikhil Verma', email: 'nikhil@cryptocore.io' } },
  { id: 'mock-16', title: 'AR/VR Developer', company: 'Visionary Tech', location: 'Pune, India', remote_policy: 'onsite', job_category: 'AR/VR', match_score: 68, salary_range: '₹12L - ₹22L', experience: '2-4 years', description: 'Create immersive AR/VR experiences for enterprise and consumer products. Work with Unity, Unreal Engine, and ARKit/ARCore. Strong 3D math and spatial computing skills required.', required_skills: ['Unity', 'ARKit', 'ARCore', 'C#', '3D Modeling', 'Spatial Computing'], recruiter: { name: 'Pooja Deshmukh', email: 'pooja@visionary.tech' } },
  { id: 'mock-17', title: 'Embedded Systems Engineer', company: 'Hardware Inc.', location: 'Bangalore, India', remote_policy: 'hybrid', job_category: 'Hardware', match_score: 81, salary_range: '₹14L - ₹24L', experience: '3-5 years', description: 'Design firmware for IoT devices and embedded systems. Program in C/C++ for ARM microcontrollers. Experience with RTOS, communication protocols (I2C, SPI, UART), and hardware debugging tools.', required_skills: ['C', 'C++', 'RTOS', 'ARM', 'IoT', 'Embedded Linux'], recruiter: { name: 'Suresh Nair', email: 'suresh@hardware-inc.com' } },
  { id: 'mock-18', title: 'Big Data Architect', company: 'MassiveData', location: 'Gurgaon, India', remote_policy: 'remote', job_category: 'Data Science', match_score: 72, salary_range: '₹28L - ₹50L', experience: '6-10 years', description: 'Architect large-scale data processing systems handling petabytes of data. Design data lakes, streaming pipelines, and analytics platforms using Hadoop, Spark, and Kafka ecosystems.', required_skills: ['Hadoop', 'Apache Spark', 'Kafka', 'Data Lake', 'AWS EMR', 'Scala'], recruiter: { name: 'Arun Krishnan', email: 'arun@massivedata.io' } },
  { id: 'mock-19', title: 'QA Automation Engineer', company: 'Testify', location: 'Noida, India', remote_policy: 'hybrid', job_category: 'QA', match_score: 89, salary_range: '₹10L - ₹18L', experience: '2-4 years', description: 'Design and implement automated test frameworks for web and API testing. Write test scripts using Selenium, Cypress, or Playwright. Integrate tests into CI/CD pipelines and maintain test coverage reports.', required_skills: ['Selenium', 'Cypress', 'JavaScript', 'CI/CD', 'API Testing', 'Test Strategy'], recruiter: { name: 'Divya Kapoor', email: 'divya@testify.qa' } },
  { id: 'mock-20', title: 'Technical Writer', company: 'DocuTech', location: 'Remote', remote_policy: 'remote', job_category: 'Documentation', match_score: 91, salary_range: '₹8L - ₹15L', experience: '2-4 years', description: 'Write clear, concise technical documentation for developer-facing products. Create API references, tutorials, guides, and architecture docs. Strong technical background with excellent written communication.', required_skills: ['Technical Writing', 'API Documentation', 'Markdown', 'Git', 'Developer Tools', 'Editing'], recruiter: { name: 'Kavita Menon', email: 'kavita@docutech.io' } },
  { id: 'mock-21', title: 'Go Developer', company: 'FastScale', location: 'Bangalore, India', remote_policy: 'remote', job_category: 'Backend', match_score: 83, salary_range: '₹18L - ₹30L', experience: '3-5 years', description: 'Build high-performance microservices in Go. Design APIs, implement concurrency patterns, and optimize for low latency. Experience with gRPC, Protocol Buffers, and cloud-native development.', required_skills: ['Go', 'gRPC', 'Microservices', 'Docker', 'Kubernetes', 'PostgreSQL'], recruiter: { name: 'Tarun Bhatia', email: 'tarun@fastscale.dev' } },
  { id: 'mock-22', title: 'Salesforce Developer', company: 'CloudCRM CRM', location: 'Hyderabad, India', remote_policy: 'hybrid', job_category: 'CRM', match_score: 64, salary_range: '₹12L - ₹22L', experience: '2-5 years', description: 'Customize and extend Salesforce using Apex, Lightning Web Components, and integrations. Build workflows, reports, and dashboards. Salesforce certifications (PD1/PD2) are a plus.', required_skills: ['Salesforce', 'Apex', 'Lightning', 'SOQL', 'Integrations', 'Workflows'], recruiter: { name: 'Geeta Rani', email: 'geeta@cloudcrm.com' } },
  { id: 'mock-23', title: 'Kotlin Developer', company: 'MicroServices LLC', location: 'Pune, India', remote_policy: 'remote', job_category: 'Backend', match_score: 77, salary_range: '₹14L - ₹24L', experience: '2-4 years', description: 'Develop backend services with Kotlin and Spring Boot. Build reactive APIs, implement database migrations, and write comprehensive tests. Experience with Coroutines and Ktor is a plus.', required_skills: ['Kotlin', 'Spring Boot', 'PostgreSQL', 'Microservices', 'Docker', 'Testing'], recruiter: { name: 'Manish Agarwal', email: 'manish@microservices.dev' } },
  { id: 'mock-24', title: 'iOS Engineer (Swift)', company: 'AppleTree', location: 'Chennai, India', remote_policy: 'onsite', job_category: 'Mobile', match_score: 86, salary_range: '₹16L - ₹28L', experience: '3-5 years', description: 'Build native iOS applications using Swift and SwiftUI. Implement complex UI, integrate with RESTful APIs, and optimize app performance. Experience with Core Data, Combine, and App Store publishing.', required_skills: ['Swift', 'SwiftUI', 'iOS', 'Core Data', 'Combine', 'Xcode'], recruiter: { name: 'Lakshmi Narayan', email: 'lakshmi@appletree.io' } },
  { id: 'mock-25', title: 'Penetration Tester', company: 'RedTeamSec', location: 'Mumbai, India', remote_policy: 'remote', job_category: 'Security', match_score: 93, salary_range: '₹18L - ₹35L', experience: '3-6 years', description: 'Conduct penetration tests on web apps, networks, and cloud infrastructure. Write detailed vulnerability reports with remediation guidance. OSCP/CEH certification preferred. Strong scripting skills in Python/Bash.', required_skills: ['Penetration Testing', 'Burp Suite', 'Python', 'Network Security', 'OWASP', 'Cloud Security'], recruiter: { name: 'Sahil Khan', email: 'sahil@redteamsec.com' } },
]

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/jobs', { params: { search: search || undefined } })
      .then(r => {
        const data = r.data || []
        if (data.length > 0) {
          setJobs(data)
          setUsingFallback(false)
        } else {
          setJobs(FALLBACK_JOBS)
          setUsingFallback(true)
        }
      })
      .catch(() => {
        setJobs(FALLBACK_JOBS)
        setUsingFallback(true)
      })
      .finally(() => setLoading(false))
  }, [search])

  const displayJobs = usingFallback && search
    ? jobs.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()))
    : jobs

  const scoreColor = (s) => s >= 75 ? 'bg-green-500/20 text-green-300 border-green-500/30' :
    s >= 50 ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'

  return (
    <div className="min-h-screen bg-surface-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6">Browse Jobs</h1>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            className="input-field pl-10" placeholder="Search by job title..." />
        </div>

        {usingFallback && (
          <div className="text-xs text-center text-gray-500 mb-4 bg-surface-800 border border-white/5 rounded-xl py-2.5">
            Showing sample jobs. Post a job as a recruiter to see real listings.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Briefcase size={32} className="text-gray-600 mx-auto mb-3" />
            <h3 className="text-foreground font-semibold mb-1">No Jobs Found</h3>
            <p className="text-gray-400 text-sm">Check back later or try a different search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayJobs.map((job, i) => (
              <motion.div key={job.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}>
                <Link to={`/jobs/${job.id}`}
                     state={job.id.startsWith('mock-') ? { mockJob: job } : undefined}
                  className="glass-card p-5 block hover:border-brand-500/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-foreground font-semibold">{job.title}</h3>
                      <p className="text-gray-400 text-sm">{job.company}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {job.location && <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>}
                        <span className="capitalize">{job.remote_policy}</span>
                        {job.job_category && <span className="px-2 py-0.5 bg-surface-700 rounded">{job.job_category}</span>}
                      </div>
                      {(job.salary_range || job.experience) && (
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                          {job.salary_range && <span className="text-green-400/80">{job.salary_range}</span>}
                          {job.experience && <span>{job.experience} exp</span>}
                        </div>
                      )}
                    </div>
                    {job.match_score !== undefined && (
                      <div className={`px-3 py-1 rounded-full text-sm font-bold border ${scoreColor(job.match_score)}`}>
                        {job.match_score}%
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
