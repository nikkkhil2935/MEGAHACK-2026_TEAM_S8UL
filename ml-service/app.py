from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os
import logging

from encoders import (
    EXPERIENCE_LEVEL_MAP,
    EMPLOYMENT_TYPE_MAP,
    COMPANY_SIZE_MAP,
    JOB_TITLE_MAP,
    COMPANY_LOCATION_MAP,
)

app = FastAPI(title="CareerBridge ML Service")
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ml-service")

# Load models from project root (one level up from ml-service/)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

github_model = joblib.load(os.path.join(BASE_DIR, "github_project_analyzer.pkl"))
salary_model = joblib.load(os.path.join(BASE_DIR, "salary_prediction_model.pkl"))
resume_model = joblib.load(os.path.join(BASE_DIR, "resume_improver_model.pkl"))

logger.info("All 3 ML models loaded successfully.")


# ── Request Schemas ──

class GitHubRequest(BaseModel):
    stars: int
    forks: int
    commits: int
    issues: int
    readme_length: int

class SalaryRequest(BaseModel):
    experience_level: str
    employment_type: str
    job_title: str
    company_location: str
    company_size: str

class ResumeRequest(BaseModel):
    skills_count: int
    projects_count: int
    education_level: int
    keywords_count: int


# ── Endpoints ──

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": True}


@app.post("/predict/github")
def predict_github(req: GitHubRequest):
    try:
        features = np.array([[req.stars, req.forks, req.commits, req.issues, req.readme_length]])
        score = float(github_model.predict(features)[0])
        score = max(0.0, min(100.0, score))
        return {
            "projectQualityScore": round(score, 2),
            "features_used": {
                "stars": req.stars,
                "forks": req.forks,
                "commits": req.commits,
                "issues": req.issues,
                "readme_length": req.readme_length,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/salary")
def predict_salary(req: SalaryRequest):
    try:
        exp = EXPERIENCE_LEVEL_MAP.get(req.experience_level)
        emp = EMPLOYMENT_TYPE_MAP.get(req.employment_type)
        job = JOB_TITLE_MAP.get(req.job_title)
        loc = COMPANY_LOCATION_MAP.get(req.company_location)
        size = COMPANY_SIZE_MAP.get(req.company_size)

        missing = []
        if exp is None: missing.append(f"experience_level: '{req.experience_level}'")
        if emp is None: missing.append(f"employment_type: '{req.employment_type}'")
        if job is None: missing.append(f"job_title: '{req.job_title}'")
        if loc is None: missing.append(f"company_location: '{req.company_location}'")
        if size is None: missing.append(f"company_size: '{req.company_size}'")

        if missing:
            raise HTTPException(status_code=422, detail=f"Unknown categories: {', '.join(missing)}")

        features = np.array([[exp, emp, job, loc, size]])
        predicted = float(salary_model.predict(features)[0])
        predicted = max(0.0, predicted)

        return {
            "predictedSalaryUSD": round(predicted, 2),
            "features_used": {
                "experience_level": req.experience_level,
                "employment_type": req.employment_type,
                "job_title": req.job_title,
                "company_location": req.company_location,
                "company_size": req.company_size,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/resume")
def predict_resume(req: ResumeRequest):
    try:
        features = np.array([[req.skills_count, req.projects_count, req.education_level, req.keywords_count]])
        score = float(resume_model.predict(features)[0])
        score = max(0.0, min(100.0, score))
        return {
            "resumeQualityScore": round(score, 2),
            "features_used": {
                "skills_count": req.skills_count,
                "projects_count": req.projects_count,
                "education_level": req.education_level,
                "keywords_count": req.keywords_count,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
