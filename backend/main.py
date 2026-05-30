import os, shutil, traceback
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User, Dataset
from schemas import SignupIn, LoginIn, TokenOut, UserOut, DatasetOut, StoryUpdate
from security import hash_password, verify_password, create_access_token, get_current_user
from config import UPLOAD_DIR, MAX_UPLOAD_MB
import analysis, pdf_report, sample_data, ai_chat
import pandas as pd

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IDSP API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def all_errors(request, exc):
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": f"Server error: {exc.__class__.__name__}: {exc}"})


# ---------- AUTH ----------
@app.post("/api/auth/signup", response_model=TokenOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(name=payload.name.strip(), email=payload.email.lower().strip(),
                password_hash=hash_password(payload.password))
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "name": user.name, "email": user.email}}


@app.post("/api/auth/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer",
            "user": {"id": user.id, "name": user.name, "email": user.email}}


@app.get("/api/auth/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ---------- DATASETS ----------
def _save_upload(file: UploadFile, user_id: int) -> Path:
    ext = Path(file.filename).suffix.lower()
    if ext not in {".csv", ".xls", ".xlsx"}:
        raise HTTPException(status_code=400, detail="Only CSV/XLSX allowed")
    dest = UPLOAD_DIR / f"u{user_id}_{int(os.times().elapsed*1000)}_{file.filename}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    if dest.stat().st_size > MAX_UPLOAD_MB * 1024 * 1024:
        dest.unlink(missing_ok=True)
        raise HTTPException(status_code=413, detail=f"File too large (>{MAX_UPLOAD_MB} MB)")
    return dest


@app.post("/api/datasets/upload", response_model=DatasetOut)
def upload_dataset(file: UploadFile = File(...),
                   user: User = Depends(get_current_user),
                   db: Session = Depends(get_db)):
    path = _save_upload(file, user.id)
    try:
        df = analysis.read_dataset(path)
    except Exception as e:
        path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"Cannot read file: {e}")
    ds = Dataset(user_id=user.id, filename=file.filename, stored_path=str(path),
                 row_count=len(df), col_count=len(df.columns))
    db.add(ds); db.commit(); db.refresh(ds)
    return ds


@app.post("/api/datasets/load-sample", response_model=DatasetOut)
def load_sample(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    data = sample_data.sample_csv_bytes()
    dest = UPLOAD_DIR / f"u{user.id}_sample.csv"
    dest.write_bytes(data)
    df = analysis.read_dataset(dest)
    ds = Dataset(user_id=user.id, filename="sample_sales.csv", stored_path=str(dest),
                 row_count=len(df), col_count=len(df.columns))
    db.add(ds); db.commit(); db.refresh(ds)
    return ds


@app.get("/api/datasets", response_model=list[DatasetOut])
def list_datasets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Dataset).filter(Dataset.user_id == user.id).order_by(Dataset.id.desc()).all()


def _own(ds_id: int, user: User, db: Session) -> Dataset:
    ds = db.query(Dataset).filter(Dataset.id == ds_id, Dataset.user_id == user.id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return ds


@app.get("/api/datasets/{ds_id}/analyze")
def analyze_dataset(ds_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = _own(ds_id, user, db)
    result = analysis.analyze(ds.stored_path)
    result["dataset"] = {"id": ds.id, "filename": ds.filename, "story": ds.story or ""}
    return result


@app.put("/api/datasets/{ds_id}/story", response_model=DatasetOut)
def update_story(ds_id: int, body: StoryUpdate,
                 user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = _own(ds_id, user, db)
    ds.story = body.story
    db.commit(); db.refresh(ds)
    return ds


@app.delete("/api/datasets/{ds_id}")
def delete_dataset(ds_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = _own(ds_id, user, db)
    Path(ds.stored_path).unlink(missing_ok=True)
    db.delete(ds); db.commit()
    return {"ok": True}


@app.get("/api/datasets/{ds_id}/pdf")
def pdf(ds_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = _own(ds_id, user, db)
    result = analysis.analyze(ds.stored_path)
    data = pdf_report.build_pdf(ds.filename, result)
    return StreamingResponse(iter([data]), media_type="application/pdf",
                             headers={"Content-Disposition": f'attachment; filename="{ds.filename}.pdf"'})


@app.post("/api/datasets/{ds_id}/chat")
def chat(ds_id: int, body: dict,
         user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ds = _own(ds_id, user, db)
    df = analysis.read_dataset(ds.stored_path)
    df = analysis.clean_dataframe(df)["df"]
    q = (body or {}).get("question", "")
    return {"answer": ai_chat.answer(df, q)}


@app.get("/api/health")
def health():
    return {"status": "ok"}
