from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import requests
import json
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.units import mm, cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Supabase connection via REST API
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_ANON_KEY')

# Supabase REST API wrapper class
class SupabaseClient:
    """Wrapper for Supabase REST API"""
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "apikey": key
        }
    
    def table(self, table_name: str):
        """Return a table query builder"""
        return TableQueryBuilder(self.url, table_name, self.headers)

class TableQueryBuilder:
    """Helper class for building Supabase queries"""
    def __init__(self, base_url: str, table: str, headers: dict):
        self.base_url = base_url
        self.table = table
        self.headers = headers
        self.url = f"{base_url}/rest/v1/{table}"
    
    def insert(self, data):
        """Insert a row"""
        response = requests.post(self.url, json=data, headers=self.headers)
        if response.status_code in [200, 201]:
            return response.json()
        raise Exception(f"Insert failed: {response.text}")
    
    def select(self, *fields):
        """Select specific fields"""
        if fields:
            self.url += f"?select={','.join(fields)}"
        else:
            self.url += "?select=*"
        return self
    
    def eq(self, column: str, value):
        """Filter by equality"""
        if "?" not in self.url:
            self.url += "?"
        else:
            self.url += "&"
        self.url += f"{column}=eq.{value}"
        return self
    
    def execute(self):
        """Execute and get results"""
        response = requests.get(self.url, headers=self.headers)
        if response.status_code == 200:
            return response.json()
        return []
    
    def single(self):
        """Get single result"""
        results = self.execute()
        return results[0] if results else None
    
    def update(self, data):
        """Update rows"""
        response = requests.patch(self.url, json=data, headers=self.headers)
        if response.status_code in [200, 204]:
            return response.json() if response.text else {}
        raise Exception(f"Update failed: {response.text}")
    
    def delete(self):
        """Delete rows"""
        response = requests.delete(self.url, headers=self.headers)
        if response.status_code in [200, 204]:
            return True
        raise Exception(f"Delete failed: {response.text}")

supabase = SupabaseClient(SUPABASE_URL, SUPABASE_KEY)

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'supinter-secret-key-2025')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="SUP'INTER University Management System")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== ENUMS & CONSTANTS =====================
class UserRole:
    FOUNDER = "founder"
    DIRECTOR = "director"
    ACCOUNTANT = "accountant"
    IT = "it"
    SECRETARY = "secretary"

class StudentStatus:
    AFFECTE = "affecté"
    NON_AFFECTE = "non_affecté"

FORMATION_TYPES = ["BTS", "DUT", "LICENCE", "MASTER", "QUALIF"]
LEVELS = ["1ère Année", "2ème Année", "3ème Année", "Master 1", "Master 2", "6 Mois"]

# ===================== PYDANTIC MODELS =====================
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = UserRole.SECRETARY
    campus_id: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str
    campus_id: str
    campus_name: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CampusCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class CampusResponse(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None

class AcademicYearCreate(BaseModel):
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool = False

class AcademicYearResponse(BaseModel):
    id: str
    name: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_active: bool

class FormationCreate(BaseModel):
    name: str
    code: str

class FormationResponse(BaseModel):
    id: str
    name: str
    code: str

class FiliereCreate(BaseModel):
    name: str
    code: str
    formation_ids: List[str]

class FiliereResponse(BaseModel):
    id: str
    name: str
    code: str
    formation_ids: List[str]
    formations: Optional[List[FormationResponse]] = None

class LevelCreate(BaseModel):
    name: str
    order: int = 1

class LevelResponse(BaseModel):
    id: str
    name: str
    order: int

class ClassCreate(BaseModel):
    name: str
    code: str
    formation_id: str
    filiere_id: str
    level_id: str
    campus_id: str
    academic_year_id: str

class ClassResponse(BaseModel):
    id: str
    name: str
    code: str
    formation_id: str
    filiere_id: str
    level_id: str
    campus_id: str
    academic_year_id: str
    formation_name: Optional[str] = None
    filiere_name: Optional[str] = None
    level_name: Optional[str] = None
    campus_name: Optional[str] = None

class SubjectCreate(BaseModel):
    name: str
    code: str
    credits: int = 2
    coefficient: float = 1.0
    formation_id: str
    filiere_id: str
    level_id: str

class SubjectResponse(BaseModel):
    id: str
    name: str
    code: str
    credits: int
    coefficient: float
    formation_id: str
    filiere_id: str
    level_id: str

class StudentCreate(BaseModel):
    permanent_id: str
    photo: Optional[str] = None
    matricule_bac: Optional[str] = None
    numero_table_bac: Optional[str] = None
    campus_id: str
    academic_year_id: str
    formation_id: str
    filiere_id: str
    level_id: str
    class_id: str
    status: str = StudentStatus.NON_AFFECTE
    first_name: str
    last_name: str
    birth_date: str
    birth_place: str
    gender: str
    phone: str
    email: Optional[str] = None
    nationality: str = "Ivoirienne"
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    tuition_amount: float = 0
    is_exonerated: bool = False

class StudentResponse(BaseModel):
    id: str
    matricule: str
    permanent_id: str
    photo: Optional[str] = None
    matricule_bac: Optional[str] = None
    numero_table_bac: Optional[str] = None
    campus_id: str
    academic_year_id: str
    formation_id: str
    filiere_id: str
    level_id: str
    class_id: str
    status: str
    first_name: str
    last_name: str
    birth_date: str
    birth_place: str
    gender: str
    phone: str
    email: Optional[str] = None
    nationality: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    tuition_amount: float
    tuition_paid: float = 0
    is_exonerated: bool
    created_at: str
    formation_name: Optional[str] = None
    filiere_name: Optional[str] = None
    level_name: Optional[str] = None
    class_name: Optional[str] = None
    campus_name: Optional[str] = None
    academic_year_name: Optional[str] = None

class StudentReenroll(BaseModel):
    academic_year_id: str
    formation_id: str
    filiere_id: str
    level_id: str
    class_id: str
    status: str = StudentStatus.NON_AFFECTE

class ProfessorCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    specialty: str
    campus_id: str

class ProfessorResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    specialty: str
    campus_id: str
    campus_name: Optional[str] = None

class ProfessorHoursCreate(BaseModel):
    professor_id: str
    academic_year_id: str
    formation_id: str
    filiere_id: str
    level_id: str
    class_id: str
    total_hours_planned: float
    date: str
    start_time: str
    end_time: str
    hours_done: float

class ProfessorHoursResponse(BaseModel):
    id: str
    professor_id: str
    professor_name: Optional[str] = None
    academic_year_id: str
    formation_id: str
    filiere_id: str
    level_id: str
    class_id: str
    total_hours_planned: float
    total_hours_done: float
    hours_remaining: float
    date: str
    start_time: str
    end_time: str

class StaffCreate(BaseModel):
    first_name: str
    last_name: str
    birth_date: str
    birth_place: str
    function: str
    phone: Optional[str] = None
    campus_id: str
    academic_year_id: str
    photo: Optional[str] = None

class StaffResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    birth_date: str
    birth_place: str
    function: str
    phone: Optional[str] = None
    campus_id: str
    academic_year_id: str
    campus_name: Optional[str] = None
    photo: Optional[str] = None

class GradeCreate(BaseModel):
    student_id: str
    subject_id: str
    semester: int
    academic_year_id: str
    value: float

class GradeResponse(BaseModel):
    id: str
    student_id: str
    subject_id: str
    subject_name: Optional[str] = None
    semester: int
    academic_year_id: str
    value: float

class TransactionCreate(BaseModel):
    date: str
    type: str  # INCOME or EXPENSE
    category: str
    amount: float
    description: str
    student_id: Optional[str] = None
    campus_id: str
    academic_year_id: str

class TransactionResponse(BaseModel):
    id: str
    date: str
    type: str
    category: str
    amount: float
    description: str
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    campus_id: str
    academic_year_id: str
    created_at: str

class ArchiveCreate(BaseModel):
    document_type: str
    student_id: str
    academic_year_id: str
    campus_id: str
    downloaded_by: str

class ArchiveResponse(BaseModel):
    id: str
    document_type: str
    student_id: str
    student_name: Optional[str] = None
    academic_year_id: str
    campus_id: str
    downloaded_by: str
    downloaded_at: str

class StudentAbsenceCreate(BaseModel):
    student_id: str
    academic_year_id: str
    date: str
    hours: float
    reason: Optional[str] = None

class StudentAbsenceResponse(BaseModel):
    id: str
    student_id: str
    student_name: Optional[str] = None
    academic_year_id: str
    date: str
    hours: float
    reason: Optional[str] = None
    total_hours: Optional[float] = None

# ===================== AUTH HELPERS =====================
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
        response = supabase.table('users').select('*').eq('id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return response.data[0]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ===================== MATRICULE GENERATOR =====================
async def generate_matricule():
    year = datetime.now().year
    prefix = f"ESI{year}"
    response = supabase.table('students').select('matricule').ilike('matricule', f'{prefix}%').execute()
    count = len(response.data) if response.data else 0
    return f"{prefix}{str(count + 1).zfill(4)}"

# ===================== AUTH ROUTES =====================
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if email already exists
    existing = supabase.table('users').select('id').eq('email', user_data.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    # Check if campus exists
    campus_response = supabase.table('campuses').select('*').eq('id', user_data.campus_id).execute()
    if not campus_response.data:
        raise HTTPException(status_code=400, detail="Campus non trouvé")
    campus = campus_response.data[0]
    
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "role": user_data.role,
        "campus_id": user_data.campus_id
    }
    
    response = supabase.table('users').insert(user_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création de l'utilisateur")
    
    token = create_access_token({"sub": user_id})
    user_response = UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        campus_id=user_data.campus_id,
        campus_name=campus.get("name")
    )
    
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    response = supabase.table('users').select('*').eq('email', credentials.email).execute()
    user = response.data[0] if response.data else None
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    campus_response = supabase.table('campuses').select('*').eq('id', user["campus_id"]).execute()
    campus = campus_response.data[0] if campus_response.data else None

    token = create_access_token({"sub": user["id"]})
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        campus_id=user["campus_id"],
        campus_name=campus.get("name") if campus else None
    )

    return TokenResponse(access_token=token, user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    campus_response = supabase.table('campuses').select('*').eq('id', current_user["campus_id"]).execute()
    campus = campus_response.data[0] if campus_response.data else None
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
        campus_id=current_user["campus_id"],
        campus_name=campus.get("name") if campus else None
    )

# ===================== USERS MANAGEMENT =====================
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(current_user: dict = Depends(get_current_user)):
    query = supabase.table('users').select('*')
    if current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])

    response = query.execute()
    users = response.data
    result = []
    for u in users:
        campus_response = supabase.table('campuses').select('*').eq('id', u["campus_id"]).execute()
        campus = campus_response.data[0] if campus_response.data else None
        result.append(UserResponse(
            id=u["id"],
            email=u["email"],
            name=u["name"],
            role=u["role"],
            campus_id=u["campus_id"],
            campus_name=campus.get("name") if campus else None
        ))
    return result

@api_router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    user_response = supabase.table('users').select('*').eq('id', user_id).execute()
    if not user_response.data:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    update_data = {
        "email": user_data.email,
        "name": user_data.name,
        "role": user_data.role,
        "campus_id": user_data.campus_id
    }
    if user_data.password:
        update_data["password"] = get_password_hash(user_data.password)
    
    supabase.table('users').update(update_data).eq('id', user_id).execute()
    
    campus_response = supabase.table('campuses').select('*').eq('id', user_data.campus_id).execute()
    campus = campus_response.data[0] if campus_response.data else None
    
    return UserResponse(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        campus_id=user_data.campus_id,
        campus_name=campus.get("name") if campus else None
    )

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('users').delete().eq('id', user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return {"message": "Utilisateur supprimé"}

# ===================== CAMPUS ROUTES =====================
@api_router.post("/campuses", response_model=CampusResponse)
async def create_campus(campus_data: CampusCreate):
    campus_id = str(uuid.uuid4())
    campus_doc = {
        "id": campus_id,
        "name": campus_data.name,
        "address": campus_data.address,
        "phone": campus_data.phone
    }
    response = supabase.table('campuses').insert(campus_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return CampusResponse(**campus_doc)

@api_router.get("/campuses", response_model=List[CampusResponse])
async def get_campuses():
    response = supabase.table('campuses').select('*').execute()
    campuses = response.data
    return [CampusResponse(**c) for c in campuses]

@api_router.put("/campuses/{campus_id}", response_model=CampusResponse)
async def update_campus(campus_id: str, campus_data: CampusCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('campuses').update({
        "name": campus_data.name,
        "address": campus_data.address,
        "phone": campus_data.phone
    }).eq('id', campus_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Campus non trouvé")
    return CampusResponse(id=campus_id, **campus_data.model_dump())

@api_router.delete("/campuses/{campus_id}")
async def delete_campus(campus_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('campuses').delete().eq('id', campus_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Campus non trouvé")
    return {"message": "Campus supprimé"}

# ===================== ACADEMIC YEAR ROUTES =====================
@api_router.post("/academic-years", response_model=AcademicYearResponse)
async def create_academic_year(year_data: AcademicYearCreate):
    year_id = str(uuid.uuid4())
    year_doc = {
        "id": year_id,
        "name": year_data.name,
        "start_date": year_data.start_date,
        "end_date": year_data.end_date,
        "is_active": year_data.is_active
    }
    if year_data.is_active:
        supabase.table('academic_years').update({"is_active": False}).execute()
    response = supabase.table('academic_years').insert(year_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return AcademicYearResponse(**year_doc)

@api_router.get("/academic-years", response_model=List[AcademicYearResponse])
async def get_academic_years():
    response = supabase.table('academic_years').select('*').execute()
    years = response.data
    return [AcademicYearResponse(**y) for y in years]

@api_router.put("/academic-years/{year_id}", response_model=AcademicYearResponse)
async def update_academic_year(year_id: str, year_data: AcademicYearCreate, current_user: dict = Depends(get_current_user)):
    if year_data.is_active:
        supabase.table('academic_years').update({"is_active": False}).execute()
    response = supabase.table('academic_years').update(year_data.model_dump()).eq('id', year_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Année académique non trouvée")
    return AcademicYearResponse(id=year_id, **year_data.model_dump())

@api_router.delete("/academic-years/{year_id}")
async def delete_academic_year(year_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('academic_years').delete().eq('id', year_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Année académique non trouvée")
    return {"message": "Année académique supprimée"}

# ===================== FORMATION ROUTES =====================
@api_router.post("/formations", response_model=FormationResponse)
async def create_formation(formation_data: FormationCreate):
    formation_id = str(uuid.uuid4())
    formation_doc = {
        "id": formation_id,
        "name": formation_data.name,
        "code": formation_data.code
    }
    response = supabase.table('formations').insert(formation_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return FormationResponse(**formation_doc)

@api_router.get("/formations", response_model=List[FormationResponse])
async def get_formations():
    response = supabase.table('formations').select('*').execute()
    formations = response.data
    return [FormationResponse(**f) for f in formations]

@api_router.put("/formations/{formation_id}", response_model=FormationResponse)
async def update_formation(formation_id: str, formation_data: FormationCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('formations').update(formation_data.model_dump()).eq('id', formation_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Formation non trouvée")
    return FormationResponse(id=formation_id, **formation_data.model_dump())

@api_router.delete("/formations/{formation_id}")
async def delete_formation(formation_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('formations').delete().eq('id', formation_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Formation non trouvée")
    return {"message": "Formation supprimée"}

# ===================== FILIERE ROUTES =====================
@api_router.post("/filieres", response_model=FiliereResponse)
async def create_filiere(filiere_data: FiliereCreate):
    filiere_id = str(uuid.uuid4())
    filiere_doc = {
        "id": filiere_id,
        "name": filiere_data.name,
        "code": filiere_data.code
    }
    response = supabase.table('filieres').insert(filiere_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    # Insert many-to-many relationships
    for formation_id in filiere_data.formation_ids:
        supabase.table('filiere_formations').insert({
            "filiere_id": filiere_id,
            "formation_id": formation_id
        }).execute()
    
    return FiliereResponse(**filiere_doc, formation_ids=filiere_data.formation_ids)

@api_router.get("/filieres", response_model=List[FiliereResponse])
async def get_filieres(formation_id: Optional[str] = None):
    if formation_id:
        # Get filieres linked to this formation
        ff_response = supabase.table('filiere_formations').select('filiere_id').eq('formation_id', formation_id).execute()
        filiere_ids = [ff['filiere_id'] for ff in ff_response.data] if ff_response.data else []
        if not filiere_ids:
            return []
        response = supabase.table('filieres').select('*').in_('id', filiere_ids).execute()
    else:
        response = supabase.table('filieres').select('*').execute()
    
    filieres = response.data
    result = []
    for f in filieres:
        # Get formation_ids for this filiere
        ff_response = supabase.table('filiere_formations').select('formation_id').eq('filiere_id', f['id']).execute()
        formation_ids = [ff['formation_id'] for ff in ff_response.data] if ff_response.data else []
        
        # Get formations
        if formation_ids:
            formations_response = supabase.table('formations').select('*').in_('id', formation_ids).execute()
            formations = formations_response.data if formations_response.data else []
        else:
            formations = []
        
        result.append(FiliereResponse(
            id=f["id"],
            name=f["name"],
            code=f["code"],
            formation_ids=formation_ids,
            formations=[FormationResponse(**fmt) for fmt in formations]
        ))
    return result

@api_router.put("/filieres/{filiere_id}", response_model=FiliereResponse)
async def update_filiere(filiere_id: str, filiere_data: FiliereCreate, current_user: dict = Depends(get_current_user)):
    # Update filiere
    response = supabase.table('filieres').update({
        "name": filiere_data.name,
        "code": filiere_data.code
    }).eq('id', filiere_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Filière non trouvée")
    
    # Update many-to-many relationships
    supabase.table('filiere_formations').delete().eq('filiere_id', filiere_id).execute()
    for formation_id in filiere_data.formation_ids:
        supabase.table('filiere_formations').insert({
            "filiere_id": filiere_id,
            "formation_id": formation_id
        }).execute()
    
    return FiliereResponse(
        id=filiere_id,
        name=filiere_data.name,
        code=filiere_data.code,
        formation_ids=filiere_data.formation_ids
    )

@api_router.delete("/filieres/{filiere_id}")
async def delete_filiere(filiere_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('filieres').delete().eq('id', filiere_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Filière non trouvée")
    return {"message": "Filière supprimée"}

# ===================== LEVEL ROUTES =====================
@api_router.post("/levels", response_model=LevelResponse)
async def create_level(level_data: LevelCreate):
    level_id = str(uuid.uuid4())
    level_doc = {
        "id": level_id,
        "name": level_data.name,
        "order": level_data.order
    }
    response = supabase.table('levels').insert(level_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return LevelResponse(**level_doc)

@api_router.get("/levels", response_model=List[LevelResponse])
async def get_levels():
    response = supabase.table('levels').select('*').order('order', desc=False).execute()
    levels = response.data
    return [LevelResponse(**l) for l in levels]

@api_router.put("/levels/{level_id}", response_model=LevelResponse)
async def update_level(level_id: str, level_data: LevelCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('levels').update(level_data.model_dump()).eq('id', level_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Niveau non trouvé")
    return LevelResponse(id=level_id, **level_data.model_dump())

@api_router.delete("/levels/{level_id}")
async def delete_level(level_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('levels').delete().eq('id', level_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Niveau non trouvé")
    return {"message": "Niveau supprimé"}

# ===================== CLASS ROUTES =====================
@api_router.post("/classes", response_model=ClassResponse)
async def create_class(class_data: ClassCreate, current_user: dict = Depends(get_current_user)):
    class_id = str(uuid.uuid4())
    class_doc = {
        "id": class_id,
        **class_data.model_dump()
    }
    response = supabase.table('classes').insert(class_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return ClassResponse(**class_doc)

@api_router.get("/classes", response_model=List[ClassResponse])
async def get_classes(
    academic_year_id: Optional[str] = None,
    formation_id: Optional[str] = None,
    filiere_id: Optional[str] = None,
    level_id: Optional[str] = None,
    campus_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('classes').select('*')
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    if formation_id:
        query = query.eq('formation_id', formation_id)
    if filiere_id:
        query = query.eq('filiere_id', filiere_id)
    if level_id:
        query = query.eq('level_id', level_id)
    if campus_id:
        query = query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])

    response = query.execute()
    classes = response.data
    result = []
    for c in classes:
        formation_response = supabase.table('formations').select('*').eq('id', c.get("formation_id")).execute()
        formation = formation_response.data[0] if formation_response.data else None
        filiere_response = supabase.table('filieres').select('*').eq('id', c.get("filiere_id")).execute()
        filiere = filiere_response.data[0] if filiere_response.data else None
        level_response = supabase.table('levels').select('*').eq('id', c.get("level_id")).execute()
        level = level_response.data[0] if level_response.data else None
        campus_response = supabase.table('campuses').select('*').eq('id', c.get("campus_id")).execute()
        campus = campus_response.data[0] if campus_response.data else None
        result.append(ClassResponse(
            **c,
            formation_name=formation.get("name") if formation else None,
            filiere_name=filiere.get("name") if filiere else None,
            level_name=level.get("name") if level else None,
            campus_name=campus.get("name") if campus else None
        ))
    return result

@api_router.put("/classes/{class_id}", response_model=ClassResponse)
async def update_class(class_id: str, class_data: ClassCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('classes').update(class_data.model_dump()).eq('id', class_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    return ClassResponse(id=class_id, **class_data.model_dump())

@api_router.delete("/classes/{class_id}")
async def delete_class(class_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('classes').delete().eq('id', class_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Classe non trouvée")
    return {"message": "Classe supprimée"}

# ===================== SUBJECT ROUTES =====================
@api_router.post("/subjects", response_model=SubjectResponse)
async def create_subject(subject_data: SubjectCreate, current_user: dict = Depends(get_current_user)):
    subject_id = str(uuid.uuid4())
    subject_doc = {
        "id": subject_id,
        **subject_data.model_dump()
    }
    response = supabase.table('subjects').insert(subject_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    return SubjectResponse(**subject_doc)

@api_router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(
    formation_id: Optional[str] = None,
    filiere_id: Optional[str] = None,
    level_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('subjects').select('*')
    if formation_id:
        query = query.eq('formation_id', formation_id)
    if filiere_id:
        query = query.eq('filiere_id', filiere_id)
    if level_id:
        query = query.eq('level_id', level_id)
    
    response = query.execute()
    subjects = response.data
    return [SubjectResponse(**s) for s in subjects]

@api_router.put("/subjects/{subject_id}", response_model=SubjectResponse)
async def update_subject(subject_id: str, subject_data: SubjectCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('subjects').update(subject_data.model_dump()).eq('id', subject_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Matière non trouvée")
    return SubjectResponse(id=subject_id, **subject_data.model_dump())

@api_router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('subjects').delete().eq('id', subject_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Matière non trouvée")
    return {"message": "Matière supprimée"}

# ===================== STUDENT ROUTES =====================
@api_router.post("/students", response_model=StudentResponse)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(get_current_user)):
    matricule = await generate_matricule()
    student_id = str(uuid.uuid4())
    
    campus_id = student_data.campus_id
    if current_user["role"] != UserRole.FOUNDER:
        campus_id = current_user["campus_id"]
    
    student_doc = {
        "id": student_id,
        "matricule": matricule,
        **student_data.model_dump(),
        "campus_id": campus_id,
        "tuition_paid": 0
    }
    
    response = supabase.table('students').insert(student_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    # Fetch related data for response
    formation_response = supabase.table('formations').select('*').eq('id', student_data.formation_id).execute()
    formation = formation_response.data[0] if formation_response.data else None
    filiere_response = supabase.table('filieres').select('*').eq('id', student_data.filiere_id).execute()
    filiere = filiere_response.data[0] if filiere_response.data else None
    level_response = supabase.table('levels').select('*').eq('id', student_data.level_id).execute()
    level = level_response.data[0] if level_response.data else None
    class_response = supabase.table('classes').select('*').eq('id', student_data.class_id).execute()
    class_obj = class_response.data[0] if class_response.data else None
    campus_response = supabase.table('campuses').select('*').eq('id', campus_id).execute()
    campus = campus_response.data[0] if campus_response.data else None
    academic_year_response = supabase.table('academic_years').select('*').eq('id', student_data.academic_year_id).execute()
    academic_year = academic_year_response.data[0] if academic_year_response.data else None
    
    return StudentResponse(
        **student_doc,
        created_at=datetime.now(timezone.utc).isoformat(),
        formation_name=formation.get("name") if formation else None,
        filiere_name=filiere.get("name") if filiere else None,
        level_name=level.get("name") if level else None,
        class_name=class_obj.get("name") if class_obj else None,
        campus_name=campus.get("name") if campus else None,
        academic_year_name=academic_year.get("name") if academic_year else None
    )

@api_router.get("/students", response_model=List[StudentResponse])
async def get_students(
    academic_year_id: Optional[str] = None,
    formation_id: Optional[str] = None,
    filiere_id: Optional[str] = None,
    level_id: Optional[str] = None,
    class_id: Optional[str] = None,
    campus_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('students').select('*')
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    if formation_id:
        query = query.eq('formation_id', formation_id)
    if filiere_id:
        query = query.eq('filiere_id', filiere_id)
    if level_id:
        query = query.eq('level_id', level_id)
    if class_id:
        query = query.eq('class_id', class_id)
    if campus_id:
        query = query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])

    response = query.execute()
    students = response.data
    result = []
    for s in students:
        formation_response = supabase.table('formations').select('*').eq('id', s.get("formation_id")).execute()
        formation = formation_response.data[0] if formation_response.data else None
        filiere_response = supabase.table('filieres').select('*').eq('id', s.get("filiere_id")).execute()
        filiere = filiere_response.data[0] if filiere_response.data else None
        level_response = supabase.table('levels').select('*').eq('id', s.get("level_id")).execute()
        level = level_response.data[0] if level_response.data else None
        class_response = supabase.table('classes').select('*').eq('id', s.get("class_id")).execute()
        class_obj = class_response.data[0] if class_response.data else None
        campus_response = supabase.table('campuses').select('*').eq('id', s.get("campus_id")).execute()
        campus = campus_response.data[0] if campus_response.data else None
        academic_year_response = supabase.table('academic_years').select('*').eq('id', s.get("academic_year_id")).execute()
        academic_year = academic_year_response.data[0] if academic_year_response.data else None
        result.append(StudentResponse(
            **s,
            formation_name=formation.get("name") if formation else None,
            filiere_name=filiere.get("name") if filiere else None,
            level_name=level.get("name") if level else None,
            class_name=class_obj.get("name") if class_obj else None,
            campus_name=campus.get("name") if campus else None,
            academic_year_name=academic_year.get("name") if academic_year else None
        ))
    return result

@api_router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, current_user: dict = Depends(get_current_user)):
    student_response = supabase.table('students').select('*').eq('id', student_id).execute()
    if not student_response.data:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    
    student = student_response.data[0]
    
    formation_response = supabase.table('formations').select('*').eq('id', student.get("formation_id")).execute()
    formation = formation_response.data[0] if formation_response.data else None
    filiere_response = supabase.table('filieres').select('*').eq('id', student.get("filiere_id")).execute()
    filiere = filiere_response.data[0] if filiere_response.data else None
    level_response = supabase.table('levels').select('*').eq('id', student.get("level_id")).execute()
    level = level_response.data[0] if level_response.data else None
    class_response = supabase.table('classes').select('*').eq('id', student.get("class_id")).execute()
    class_obj = class_response.data[0] if class_response.data else None
    campus_response = supabase.table('campuses').select('*').eq('id', student.get("campus_id")).execute()
    campus = campus_response.data[0] if campus_response.data else None
    academic_year_response = supabase.table('academic_years').select('*').eq('id', student.get("academic_year_id")).execute()
    academic_year = academic_year_response.data[0] if academic_year_response.data else None
    
    return StudentResponse(
        **student,
        formation_name=formation.get("name") if formation else None,
        filiere_name=filiere.get("name") if filiere else None,
        level_name=level.get("name") if level else None,
        class_name=class_obj.get("name") if class_obj else None,
        campus_name=campus.get("name") if campus else None,
        academic_year_name=academic_year.get("name") if academic_year else None
    )

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student_data: StudentCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('students').update(student_data.model_dump()).eq('id', student_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    return await get_student(student_id, current_user)

@api_router.post("/students/{student_id}/reenroll", response_model=StudentResponse)
async def reenroll_student(student_id: str, reenroll_data: StudentReenroll, current_user: dict = Depends(get_current_user)):
    student_response = supabase.table('students').select('*').eq('id', student_id).execute()
    if not student_response.data:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    
    supabase.table('students').update(reenroll_data.model_dump()).eq('id', student_id).execute()
    return await get_student(student_id, current_user)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('students').delete().eq('id', student_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Étudiant non trouvé")
    return {"message": "Étudiant supprimé"}

# ===================== PROFESSOR ROUTES =====================
@api_router.post("/professors", response_model=ProfessorResponse)
async def create_professor(professor_data: ProfessorCreate, current_user: dict = Depends(get_current_user)):
    professor_id = str(uuid.uuid4())
    campus_id = professor_data.campus_id
    if current_user["role"] != UserRole.FOUNDER:
        campus_id = current_user["campus_id"]
    
    professor_doc = {
        "id": professor_id,
        **professor_data.model_dump(),
        "campus_id": campus_id
    }
    response = supabase.table('professors').insert(professor_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    campus_response = supabase.table('campuses').select('*').eq('id', campus_id).execute()
    campus = campus_response.data[0] if campus_response.data else None
    return ProfessorResponse(**professor_doc, campus_name=campus.get("name") if campus else None)

@api_router.get("/professors", response_model=List[ProfessorResponse])
async def get_professors(campus_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = supabase.table('professors').select('*')
    if campus_id:
        query = query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])

    response = query.execute()
    professors = response.data
    result = []
    for p in professors:
        campus_response = supabase.table('campuses').select('*').eq('id', p.get("campus_id")).execute()
        campus = campus_response.data[0] if campus_response.data else None
        result.append(ProfessorResponse(**p, campus_name=campus.get("name") if campus else None))
    return result

@api_router.put("/professors/{professor_id}", response_model=ProfessorResponse)
async def update_professor(professor_id: str, professor_data: ProfessorCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('professors').update(professor_data.model_dump()).eq('id', professor_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Professeur non trouvé")
    campus_response = supabase.table('campuses').select('*').eq('id', professor_data.campus_id).execute()
    campus = campus_response.data[0] if campus_response.data else None
    return ProfessorResponse(id=professor_id, **professor_data.model_dump(), campus_name=campus.get("name") if campus else None)

@api_router.delete("/professors/{professor_id}")
async def delete_professor(professor_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('professors').delete().eq('id', professor_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Professeur non trouvé")
    return {"message": "Professeur supprimé"}

# ===================== PROFESSOR HOURS ROUTES =====================
@api_router.post("/professor-hours", response_model=ProfessorHoursResponse)
async def create_professor_hours(hours_data: ProfessorHoursCreate, current_user: dict = Depends(get_current_user)):
    hours_id = str(uuid.uuid4())
    hours_doc = {
        "id": hours_id,
        **hours_data.model_dump(),
        "total_hours_done": hours_data.hours_done,
        "hours_remaining": hours_data.total_hours_planned - hours_data.hours_done
    }
    response = supabase.table('professor_hours').insert(hours_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    professor_response = supabase.table('professors').select('*').eq('id', hours_data.professor_id).execute()
    professor = professor_response.data[0] if professor_response.data else None
    professor_name = f"{professor.get('first_name', '')} {professor.get('last_name', '')}" if professor else None
    
    return ProfessorHoursResponse(**hours_doc, professor_name=professor_name)

@api_router.get("/professor-hours", response_model=List[ProfessorHoursResponse])
async def get_professor_hours(
    professor_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('professor_hours').select('*')
    if professor_id:
        query = query.eq('professor_id', professor_id)
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    
    response = query.execute()
    hours_list = response.data
    result = []
    for h in hours_list:
        professor_response = supabase.table('professors').select('*').eq('id', h.get("professor_id")).execute()
        professor = professor_response.data[0] if professor_response.data else None
        professor_name = f"{professor.get('first_name', '')} {professor.get('last_name', '')}" if professor else None
        result.append(ProfessorHoursResponse(**h, professor_name=professor_name))
    return result

@api_router.put("/professor-hours/{hours_id}", response_model=ProfessorHoursResponse)
async def update_professor_hours(hours_id: str, hours_data: ProfessorHoursCreate, current_user: dict = Depends(get_current_user)):
    update_doc = {
        **hours_data.model_dump(),
        "total_hours_done": hours_data.hours_done,
        "hours_remaining": hours_data.total_hours_planned - hours_data.hours_done
    }
    response = supabase.table('professor_hours').update(update_doc).eq('id', hours_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Heures non trouvées")
    
    professor_response = supabase.table('professors').select('*').eq('id', hours_data.professor_id).execute()
    professor = professor_response.data[0] if professor_response.data else None
    professor_name = f"{professor.get('first_name', '')} {professor.get('last_name', '')}" if professor else None
    
    return ProfessorHoursResponse(id=hours_id, **update_doc, professor_name=professor_name)

@api_router.delete("/professor-hours/{hours_id}")
async def delete_professor_hours(hours_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('professor_hours').delete().eq('id', hours_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Heures non trouvées")
    return {"message": "Heures supprimées"}

# ===================== STAFF ROUTES =====================
@api_router.post("/staff", response_model=StaffResponse)
async def create_staff(staff_data: StaffCreate, current_user: dict = Depends(get_current_user)):
    staff_id = str(uuid.uuid4())
    campus_id = staff_data.campus_id
    if current_user["role"] != UserRole.FOUNDER:
        campus_id = current_user["campus_id"]
    
    staff_doc = {
        "id": staff_id,
        **staff_data.model_dump(),
        "campus_id": campus_id
    }
    response = supabase.table('staff').insert(staff_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    campus_response = supabase.table('campuses').select('*').eq('id', campus_id).execute()
    campus = campus_response.data[0] if campus_response.data else None
    return StaffResponse(**staff_doc, campus_name=campus.get("name") if campus else None)

@api_router.get("/staff", response_model=List[StaffResponse])
async def get_staff(
    campus_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('staff').select('*')
    if campus_id:
        query = query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    
    response = query.execute()
    staff_list = response.data
    result = []
    for s in staff_list:
        campus_response = supabase.table('campuses').select('*').eq('id', s.get("campus_id")).execute()
        campus = campus_response.data[0] if campus_response.data else None
        result.append(StaffResponse(**s, campus_name=campus.get("name") if campus else None))
    return result

@api_router.put("/staff/{staff_id}", response_model=StaffResponse)
async def update_staff(staff_id: str, staff_data: StaffCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('staff').update(staff_data.model_dump()).eq('id', staff_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Personnel non trouvé")
    campus_response = supabase.table('campuses').select('*').eq('id', staff_data.campus_id).execute()
    campus = campus_response.data[0] if campus_response.data else None
    return StaffResponse(id=staff_id, **staff_data.model_dump(), campus_name=campus.get("name") if campus else None)

@api_router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('staff').delete().eq('id', staff_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Personnel non trouvé")
    return {"message": "Personnel supprimé"}

# ===================== GRADE ROUTES =====================
@api_router.post("/grades", response_model=GradeResponse)
async def create_grade(grade_data: GradeCreate, current_user: dict = Depends(get_current_user)):
    grade_id = str(uuid.uuid4())
    grade_doc = {
        "id": grade_id,
        **grade_data.model_dump()
    }
    response = supabase.table('grades').insert(grade_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    subject_response = supabase.table('subjects').select('*').eq('id', grade_data.subject_id).execute()
    subject = subject_response.data[0] if subject_response.data else None
    return GradeResponse(**grade_doc, subject_name=subject.get("name") if subject else None)

@api_router.get("/grades", response_model=List[GradeResponse])
async def get_grades(
    student_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    semester: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('grades').select('*')
    if student_id:
        query = query.eq('student_id', student_id)
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    if semester:
        query = query.eq('semester', semester)
    
    response = query.execute()
    grades = response.data
    result = []
    for g in grades:
        subject_response = supabase.table('subjects').select('*').eq('id', g.get("subject_id")).execute()
        subject = subject_response.data[0] if subject_response.data else None
        result.append(GradeResponse(**g, subject_name=subject.get("name") if subject else None))
    return result

@api_router.put("/grades/{grade_id}", response_model=GradeResponse)
async def update_grade(grade_id: str, grade_data: GradeCreate, current_user: dict = Depends(get_current_user)):
    response = supabase.table('grades').update(grade_data.model_dump()).eq('id', grade_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    subject_response = supabase.table('subjects').select('*').eq('id', grade_data.subject_id).execute()
    subject = subject_response.data[0] if subject_response.data else None
    return GradeResponse(id=grade_id, **grade_data.model_dump(), subject_name=subject.get("name") if subject else None)

@api_router.delete("/grades/{grade_id}")
async def delete_grade(grade_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('grades').delete().eq('id', grade_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Note non trouvée")
    return {"message": "Note supprimée"}

# ===================== TRANSACTION ROUTES =====================
@api_router.post("/transactions", response_model=TransactionResponse)
async def create_transaction(transaction_data: TransactionCreate, current_user: dict = Depends(get_current_user)):
    transaction_id = str(uuid.uuid4())
    campus_id = transaction_data.campus_id
    if current_user["role"] != UserRole.FOUNDER:
        campus_id = current_user["campus_id"]
    
    transaction_doc = {
        "id": transaction_id,
        **transaction_data.model_dump(),
        "campus_id": campus_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    response = supabase.table('transactions').insert(transaction_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    # Update student tuition if student payment
    if transaction_data.student_id and transaction_data.type == "INCOME" and transaction_data.category == "Scolarité":
        student_response = supabase.table('students').select('tuition_paid').eq('id', transaction_data.student_id).execute()
        if student_response.data:
            student = student_response.data[0]
            new_tuition_paid = (student.get('tuition_paid', 0) or 0) + transaction_data.amount
            supabase.table('students').update({"tuition_paid": new_tuition_paid}).eq('id', transaction_data.student_id).execute()
    
    student_name = None
    if transaction_data.student_id:
        student_response = supabase.table('students').select('*').eq('id', transaction_data.student_id).execute()
        if student_response.data:
            student = student_response.data[0]
            student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
    
    return TransactionResponse(**transaction_doc, student_name=student_name)

@api_router.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    campus_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    type: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('transactions').select('*')
    if campus_id:
        query = query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    if type:
        query = query.eq('type', type)
    
    response = query.order('created_at', desc=True).execute()
    transactions = response.data
    result = []
    for t in transactions:
        student_name = None
        if t.get("student_id"):
            student_response = supabase.table('students').select('*').eq('id', t.get("student_id")).execute()
            if student_response.data:
                student = student_response.data[0]
                student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}"
        result.append(TransactionResponse(**t, student_name=student_name))
    return result

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, current_user: dict = Depends(get_current_user)):
    transaction_response = supabase.table('transactions').select('*').eq('id', transaction_id).execute()
    if not transaction_response.data:
        raise HTTPException(status_code=404, detail="Transaction non trouvée")
    
    transaction = transaction_response.data[0]
    
    # Reverse student payment if applicable
    if transaction.get("student_id") and transaction.get("type") == "INCOME" and transaction.get("category") == "Scolarité":
        student_response = supabase.table('students').select('tuition_paid').eq('id', transaction.get("student_id")).execute()
        if student_response.data:
            student = student_response.data[0]
            new_tuition_paid = (student.get('tuition_paid', 0) or 0) - transaction.get("amount", 0)
            supabase.table('students').update({"tuition_paid": new_tuition_paid}).eq('id', transaction.get("student_id")).execute()
    
    supabase.table('transactions').delete().eq('id', transaction_id).execute()
    return {"message": "Transaction supprimée"}

# ===================== ARCHIVE ROUTES =====================
@api_router.post("/archives", response_model=ArchiveResponse)
async def create_archive(archive_data: ArchiveCreate, current_user: dict = Depends(get_current_user)):
    archive_id = str(uuid.uuid4())
    archive_doc = {
        "id": archive_id,
        **archive_data.model_dump(),
        "downloaded_at": datetime.now(timezone.utc).isoformat()
    }
    response = supabase.table('archives').insert(archive_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    student_response = supabase.table('students').select('*').eq('id', archive_data.student_id).execute()
    student = student_response.data[0] if student_response.data else None
    student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else None
    
    return ArchiveResponse(**archive_doc, student_name=student_name)

@api_router.get("/archives", response_model=List[ArchiveResponse])
async def get_archives(
    campus_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    document_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('archives').select('*')
    if campus_id:
        query = query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        query = query.eq('campus_id', current_user["campus_id"])
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    if document_type:
        query = query.eq('document_type', document_type)
    
    response = query.order('downloaded_at', desc=True).execute()
    archives = response.data
    result = []
    for a in archives:
        student_response = supabase.table('students').select('*').eq('id', a.get("student_id")).execute()
        student = student_response.data[0] if student_response.data else None
        student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else None
        result.append(ArchiveResponse(**a, student_name=student_name))
    return result

# ===================== STUDENT ABSENCE ROUTES =====================
@api_router.post("/student-absences", response_model=StudentAbsenceResponse)
async def create_student_absence(absence_data: StudentAbsenceCreate, current_user: dict = Depends(get_current_user)):
    absence_id = str(uuid.uuid4())
    absence_doc = {
        "id": absence_id,
        **absence_data.model_dump()
    }
    response = supabase.table('student_absences').insert(absence_doc).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Erreur lors de la création")
    
    student_response = supabase.table('students').select('*').eq('id', absence_data.student_id).execute()
    student = student_response.data[0] if student_response.data else None
    student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else None
    
    return StudentAbsenceResponse(**absence_doc, student_name=student_name)

@api_router.get("/student-absences", response_model=List[StudentAbsenceResponse])
async def get_student_absences(
    student_id: Optional[str] = None,
    academic_year_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table('student_absences').select('*')
    if student_id:
        query = query.eq('student_id', student_id)
    if academic_year_id:
        query = query.eq('academic_year_id', academic_year_id)
    
    response = query.execute()
    absences = response.data
    result = []
    for a in absences:
        student_response = supabase.table('students').select('*').eq('id', a.get("student_id")).execute()
        student = student_response.data[0] if student_response.data else None
        student_name = f"{student.get('first_name', '')} {student.get('last_name', '')}" if student else None
        
        # Calculate total hours for this student
        total_absences_response = supabase.table('student_absences').select('hours').eq('student_id', a.get("student_id")).eq('academic_year_id', a.get("academic_year_id")).execute()
        total_hours = sum([abs_item.get('hours', 0) for abs_item in total_absences_response.data]) if total_absences_response.data else 0
        
        result.append(StudentAbsenceResponse(**a, student_name=student_name, total_hours=total_hours))
    return result

@api_router.delete("/student-absences/{absence_id}")
async def delete_student_absence(absence_id: str, current_user: dict = Depends(get_current_user)):
    response = supabase.table('student_absences').delete().eq('id', absence_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Absence non trouvée")
    return {"message": "Absence supprimée"}

# ===================== DASHBOARD STATS =====================
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(
    academic_year_id: Optional[str] = None,
    campus_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    # Base queries
    student_query = supabase.table('students').select('*', count='exact')
    if academic_year_id:
        student_query = student_query.eq('academic_year_id', academic_year_id)
    if campus_id:
        student_query = student_query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        student_query = student_query.eq('campus_id', current_user["campus_id"])
    
    student_response = student_query.execute()
    total_students = len(student_response.data) if student_response.data else 0
    
    # Professors count
    prof_query = supabase.table('professors').select('*', count='exact')
    if campus_id:
        prof_query = prof_query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        prof_query = prof_query.eq('campus_id', current_user["campus_id"])
    
    prof_response = prof_query.execute()
    total_professors = len(prof_response.data) if prof_response.data else 0
    
    # Classes count
    class_query = supabase.table('classes').select('*', count='exact')
    if academic_year_id:
        class_query = class_query.eq('academic_year_id', academic_year_id)
    if campus_id:
        class_query = class_query.eq('campus_id', campus_id)
    
    class_response = class_query.execute()
    total_classes = len(class_response.data) if class_response.data else 0
    
    # Formations and Filieres count
    formations_response = supabase.table('formations').select('*', count='exact').execute()
    total_formations = len(formations_response.data) if formations_response.data else 0
    
    filieres_response = supabase.table('filieres').select('*', count='exact').execute()
    total_filieres = len(filieres_response.data) if filieres_response.data else 0
    
    # Students by formation
    students_by_formation = {}
    if student_response.data:
        for student in student_response.data:
            formation_id = student.get('formation_id')
            if formation_id:
                students_by_formation[formation_id] = students_by_formation.get(formation_id, 0) + 1
    
    formation_stats = []
    for formation_id, count in students_by_formation.items():
        formation_response = supabase.table('formations').select('*').eq('id', formation_id).execute()
        formation = formation_response.data[0] if formation_response.data else None
        formation_stats.append({
            "formation_id": formation_id,
            "formation_name": formation.get("name") if formation else "Inconnu",
            "count": count
        })
    
    # Students by filiere
    students_by_filiere = {}
    if student_response.data:
        for student in student_response.data:
            filiere_id = student.get('filiere_id')
            if filiere_id:
                students_by_filiere[filiere_id] = students_by_filiere.get(filiere_id, 0) + 1
    
    filiere_stats = []
    for filiere_id, count in students_by_filiere.items():
        filiere_response = supabase.table('filieres').select('*').eq('id', filiere_id).execute()
        filiere = filiere_response.data[0] if filiere_response.data else None
        filiere_stats.append({
            "filiere_id": filiere_id,
            "filiere_name": filiere.get("name") if filiere else "Inconnu",
            "count": count
        })
    
    # Students by level
    students_by_level = {}
    if student_response.data:
        for student in student_response.data:
            level_id = student.get('level_id')
            if level_id:
                students_by_level[level_id] = students_by_level.get(level_id, 0) + 1
    
    level_stats = []
    for level_id, count in students_by_level.items():
        level_response = supabase.table('levels').select('*').eq('id', level_id).execute()
        level = level_response.data[0] if level_response.data else None
        level_stats.append({
            "level_id": level_id,
            "level_name": level.get("name") if level else "Inconnu",
            "count": count
        })
    
    # Financial summary
    transaction_query = supabase.table('transactions').select('*')
    if campus_id:
        transaction_query = transaction_query.eq('campus_id', campus_id)
    elif current_user["role"] != UserRole.FOUNDER:
        transaction_query = transaction_query.eq('campus_id', current_user["campus_id"])
    if academic_year_id:
        transaction_query = transaction_query.eq('academic_year_id', academic_year_id)
    
    transactions = transaction_query.execute().data if transaction_query.execute().data else []
    
    total_income = sum([t.get('amount', 0) for t in transactions if t.get('type') == 'INCOME'])
    total_expenses = sum([t.get('amount', 0) for t in transactions if t.get('type') == 'EXPENSE'])
    
    return {
        "total_students": total_students,
        "total_professors": total_professors,
        "total_classes": total_classes,
        "total_formations": total_formations,
        "total_filieres": total_filieres,
        "students_by_formation": formation_stats,
        "students_by_filiere": filiere_stats,
        "students_by_level": level_stats,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses
    }

# ===================== HEALTH CHECK =====================
@api_router.get("/")
async def root():
    return {"message": "SUP'INTER University Management System API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
