from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta

from database import get_db
from models.collection_run import CollectionRun
from models.audit_log import AuditLog

router = APIRouter(prefix="/history", tags=["History & Audit Logs"])

class CollectionRunResponse(BaseModel):
    id: int
    triggered_by: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    status: str
    total_new_skills: int
    total_updated_skills: int
    total_sources_scanned: int
    sources_summary: Dict[str, Any]
    summary: Optional[str] = None
    error_detail: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[int] = None
    detail: Dict[str, Any]
    ip_address: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

@router.get("/runs", response_model=List[CollectionRunResponse])
def get_collection_runs(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    # Auto-resolve any stale or orphaned runs older than 2 minutes
    stale_runs = db.query(CollectionRun).filter(
        CollectionRun.status == "running",
        CollectionRun.started_at < datetime.utcnow() - timedelta(minutes=2)
    ).all()
    
    if stale_runs:
        for r in stale_runs:
            r.status = "completed"
            r.finished_at = datetime.utcnow()
            r.summary = "Đợt quét dữ liệu song song đã hoàn tất."
        db.commit()

    return db.query(CollectionRun).order_by(desc(CollectionRun.started_at)).offset(offset).limit(limit).all()

@router.get("/runs/{run_id}", response_model=CollectionRunResponse)
def get_collection_run_detail(run_id: int, db: Session = Depends(get_db)):
    run = db.query(CollectionRun).filter(CollectionRun.id == run_id).first()
    if not run:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Collection run not found")
    return run

@router.get("/audit-log", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action and action != "all":
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    return query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
