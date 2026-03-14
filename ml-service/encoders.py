# Label encoding maps for the salary prediction model
# These map human-readable values to the integer codes expected by the trained RandomForestRegressor.
# The model was trained on the Kaggle ds-salaries dataset with LabelEncoder (alphabetical ordering).

EXPERIENCE_LEVEL_MAP = {
    # Alphabetical LabelEncoder: EN=0, EX=1, MI=2, SE=3
    "EN": 0, "Entry": 0, "Junior": 0, "Fresher": 0,
    "EX": 1, "Executive": 1, "Lead": 1, "Director": 1, "Principal": 1,
    "MI": 2, "Mid": 2, "Mid-level": 2,
    "SE": 3, "Senior": 3,
}

EMPLOYMENT_TYPE_MAP = {
    # Alphabetical: CT=0, FL=1, FT=2, PT=3
    "CT": 0, "Contract": 0,
    "FL": 1, "Freelance": 1,
    "FT": 2, "Full-time": 2, "Full time": 2,
    "PT": 3, "Part-time": 3, "Part time": 3,
    "Remote": 2,  # Remote is typically full-time
}

COMPANY_SIZE_MAP = {
    # Alphabetical: L=0, M=1, S=2
    "L": 0, "Large": 0,
    "M": 1, "Medium": 1,
    "S": 2, "Small": 2,
}

JOB_TITLE_MAP = {
    "AI Scientist": 0,
    "Analytics Engineer": 1,
    "Applied Data Scientist": 2,
    "Applied Machine Learning Scientist": 3,
    "BI Data Analyst": 4,
    "Business Data Analyst": 5,
    "Cloud Architect": 6,
    "Cloud Data Architect": 6,
    "Cloud Data Engineer": 7,
    "Computer Vision Engineer": 8,
    "Computer Vision Software Engineer": 9,
    "Data Analyst": 10,
    "Data Architect": 11,
    "Data Engineer": 12,
    "Data Engineering Manager": 13,
    "Data Manager": 14,
    "Data Science Consultant": 15,
    "Data Science Manager": 16,
    "Data Scientist": 17,
    "Data Specialist": 18,
    "DevOps Engineer": 19,
    "Director of Data Science": 20,
    "ETL Developer": 21,
    "Finance Data Analyst": 22,
    "Frontend Developer": 23,
    "Full Stack Developer": 24,
    "Head of Data": 25,
    "Head of Data Science": 26,
    "Head of Machine Learning": 27,
    "Lead Data Analyst": 28,
    "Lead Data Engineer": 29,
    "Lead Data Scientist": 30,
    "Lead Machine Learning Engineer": 31,
    "ML Engineer": 32,
    "Machine Learning Developer": 33,
    "Machine Learning Engineer": 34,
    "Machine Learning Infrastructure Engineer": 35,
    "Machine Learning Manager": 36,
    "Machine Learning Scientist": 37,
    "Mobile Developer": 38,
    "NLP Engineer": 39,
    "Principal Data Analyst": 40,
    "Principal Data Engineer": 41,
    "Principal Data Scientist": 42,
    "Product Manager": 43,
    "Research Scientist": 44,
    "Security Engineer": 45,
    "Software Engineer": 46,
    "UI/UX Designer": 47,
    "Backend Developer": 48,
}

COMPANY_LOCATION_MAP = {
    "AE": 0, "AS": 1, "AT": 2, "AU": 3, "BE": 4, "BR": 5,
    "CA": 6, "CF": 7, "CH": 8, "CL": 9, "CN": 10, "CO": 11,
    "CZ": 12, "DE": 13, "DK": 14, "DZ": 15, "EE": 16, "ES": 17,
    "FR": 18, "GB": 19, "GR": 20, "HN": 21, "HR": 22, "HU": 23,
    "IE": 24, "IL": 25, "IN": 26, "IQ": 27, "IR": 28, "IT": 29,
    "JP": 30, "KE": 31, "LU": 32, "MD": 33, "MT": 34, "MX": 35,
    "MY": 36, "NG": 37, "NL": 38, "NZ": 39, "PH": 40, "PK": 41,
    "PL": 42, "PT": 43, "RO": 44, "RU": 45, "SG": 46, "SI": 47,
    "TR": 48, "UA": 49, "US": 50,
    # Friendly name mappings
    "India": 26, "United States": 50, "United Kingdom": 19,
    "Germany": 13, "Canada": 6, "Australia": 3, "Singapore": 46,
    "France": 18, "Spain": 17, "Japan": 30, "Netherlands": 38,
    "Brazil": 5, "China": 10, "Italy": 29, "Ireland": 24,
    "Israel": 25, "Switzerland": 8, "Poland": 42, "Mexico": 35,
    "New Zealand": 39, "Portugal": 43, "Turkey": 48,
}
