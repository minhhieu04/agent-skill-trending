from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta, date

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

class AuditStatsSummary(BaseModel):
    total_events: int
    quota_exceeded_count: int
    collection_completed_count: int
    failed_count: int
    most_recent_quota_error: Optional[str] = None
    most_recent_quota_source: Optional[str] = None

# ──────────────────────────────────────────────────────────────────────────────
# Collection Runs
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/runs", response_model=List[CollectionRunResponse])
def get_collection_runs(
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, description="Filter by status: running, completed, failed"),
    db: Session = Depends(get_db)
):
    # Auto-resolve stale runs older than 2 minutes
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

    query = db.query(CollectionRun)
    if status:
        query = query.filter(CollectionRun.status == status)
    return query.order_by(desc(CollectionRun.started_at)).offset(offset).limit(limit).all()

@router.get("/runs/{run_id}", response_model=CollectionRunResponse)
def get_collection_run_detail(run_id: int, db: Session = Depends(get_db)):
    run = db.query(CollectionRun).filter(CollectionRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Collection run not found")
    return run

# ──────────────────────────────────────────────────────────────────────────────
# Audit Logs
# ──────────────────────────────────────────────────────────────────────────────

@router.get("/audit-log", response_model=List[AuditLogResponse])
def get_audit_logs(
    action: Optional[str] = Query(None, description="Filter by action (e.g. quota_exceeded, collection_completed, trigger_collection)"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    date_from: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    source: Optional[str] = Query(None, description="Filter quota errors by source (github, reddit, hackernews)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if action and action != "all":
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if date_from:
        query = query.filter(AuditLog.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(AuditLog.created_at <= datetime.combine(date_to, datetime.max.time()))
    
    logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()
    
    # If filtering by source (only meaningful for quota_exceeded events)
    if source:
        logs = [l for l in logs if l.detail.get("source") == source]

    return logs

@router.get("/audit-log/stats", response_model=AuditStatsSummary)
def get_audit_stats(
    days: int = Query(7, ge=1, le=90, description="Look-back window in days"),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated audit statistics for the given look-back window.
    Useful for monitoring quota health at a glance.
    """
    since = datetime.utcnow() - timedelta(days=days)
    base_q = db.query(AuditLog).filter(AuditLog.created_at >= since)

    total = base_q.count()
    quota_count = base_q.filter(AuditLog.action == "quota_exceeded").count()
    completed_count = base_q.filter(AuditLog.action == "collection_completed").count()
    failed_count = base_q.filter(AuditLog.action.in_(["collection_failed", "quota_exceeded"])).count()

    # Most recent quota error detail
    most_recent_quota = (
        base_q.filter(AuditLog.action == "quota_exceeded")
        .order_by(desc(AuditLog.created_at))
        .first()
    )

    recent_reason = None
    recent_source = None
    if most_recent_quota:
        recent_reason = most_recent_quota.detail.get("reason")
        recent_source = most_recent_quota.detail.get("source")

    return AuditStatsSummary(
        total_events=total,
        quota_exceeded_count=quota_count,
        collection_completed_count=completed_count,
        failed_count=failed_count,
        most_recent_quota_error=recent_reason,
        most_recent_quota_source=recent_source,
    )
