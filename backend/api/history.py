from fastapi import APIRouter, Depends, Query, HTTPException, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_, cast, String
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta, date

from database import get_db
from models.collection_run import CollectionRun
from models.audit_log import AuditLog
from models.user import User
from middleware.auth import get_current_user

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

class DailyActivityStat(BaseModel):
    date: str
    total: int
    success: int
    error: int

class ActionDistributionStat(BaseModel):
    action: str
    label: str
    count: int
    percentage: float

class AuditStatsSummary(BaseModel):
    total_events: int
    quota_exceeded_count: int
    collection_completed_count: int
    failed_count: int
    success_count: int = 0
    error_rate_percent: float = 0.0
    active_users_count: int = 0
    most_recent_quota_error: Optional[str] = None
    most_recent_quota_source: Optional[str] = None
    daily_timeline: List[DailyActivityStat] = []
    action_distribution: List[ActionDistributionStat] = []

class AuditLogPageResponse(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    has_next: bool
    has_prev: bool

ERROR_ACTIONS = {"quota_exceeded", "collection_failed", "login_failed"}

def is_error_action(action: Optional[str]) -> bool:
    if not action:
        return False
    act = action.lower()
    return act in ERROR_ACTIONS or "fail" in act or "error" in act

ACTION_LABELS = {
    "login": "Đăng nhập",
    "login_failed": "Đăng nhập thất bại",
    "register": "Đăng ký",
    "bookmark": "Lưu Bookmark",
    "unbookmark": "Hủy Bookmark",
    "bookmark_bundle": "Lưu Bundle",
    "trigger_collection": "Kích hoạt Quét",
    "collection_completed": "Quét hoàn tất",
    "collection_failed": "Quét thất bại",
    "quota_exceeded": "Vượt Quota API",
    "update_preferences": "Cập nhật Sở thích",
    "gemini_categorizer": "Phân loại Gemini AI",
}

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

@router.get("/audit-log", response_model=Union[AuditLogPageResponse, List[AuditLogResponse]])
def get_audit_logs(
    response: Response,
    action: Optional[str] = Query(None, description="Filter by action (e.g. login, bookmark, quota_exceeded)"),
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    username: Optional[str] = Query(None, description="Filter by username"),
    search: Optional[str] = Query(None, description="Search in action, username, IP, target"),
    date_from: Optional[date] = Query(None, description="Filter from date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter to date (YYYY-MM-DD)"),
    source: Optional[str] = Query(None, description="Filter quota errors by source"),
    page: Optional[int] = Query(None, ge=1, description="Page number (1-based). If provided, returns envelope."),
    page_size: int = Query(50, ge=1, le=200, description="Page size"),
    limit: Optional[int] = Query(None, ge=1, le=200, description="Limit for backward compatibility"),
    offset: Optional[int] = Query(None, ge=0, description="Offset for backward compatibility"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)

    if not current_user.is_admin:
        # Non-admin user can only view their own activity logs ("My Activity")
        if user_id is not None and user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view audit logs of other users"
            )
        if username and username.strip() and username.strip().lower() != current_user.username.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view audit logs of other users"
            )
        query = query.filter(AuditLog.user_id == current_user.id)
    else:
        # Admin has Master View and can filter across all users
        if user_id is not None:
            query = query.filter(AuditLog.user_id == user_id)
        if username and username.strip():
            query = query.filter(AuditLog.username.ilike(f"%{username.strip()}%"))

    # Action filter
    if action and action != "all":
        query = query.filter(AuditLog.action == action)

    # Date range filters
    if date_from:
        query = query.filter(AuditLog.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.filter(AuditLog.created_at <= datetime.combine(date_to, datetime.max.time()))


    # Instant multi-column search
    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditLog.action.ilike(s),
                AuditLog.username.ilike(s),
                AuditLog.target_type.ilike(s),
                AuditLog.ip_address.ilike(s),
                cast(AuditLog.detail, String).ilike(s)
            )
        )

    # Source filter at database query level
    if source and source.strip():
        src = source.strip()
        query = query.filter(cast(AuditLog.detail, String).ilike(f'%"source": "{src}"%'))

    # Total count
    total = query.count()
    response.headers["X-Total-Count"] = str(total)

    # Determine pagination mode
    if page is not None:
        p_size = page_size
        p_offset = (page - 1) * p_size
        items = query.order_by(desc(AuditLog.created_at)).offset(p_offset).limit(p_size).all()
        total_pages = max(1, (total + p_size - 1) // p_size)
        return {
            "items": [AuditLogResponse.model_validate(item) for item in items],
            "total": total,
            "page": page,
            "page_size": p_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
    else:
        eff_limit = limit if limit is not None else 50
        eff_offset = offset if offset is not None else 0
        items = query.order_by(desc(AuditLog.created_at)).offset(eff_offset).limit(eff_limit).all()
        return [AuditLogResponse.model_validate(item) for item in items]

@router.get("/audit-log/stats", response_model=AuditStatsSummary)
def get_audit_stats(
    days: int = Query(7, ge=1, le=90, description="Look-back window in days"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated audit statistics for the given look-back window.
    Includes daily timeline, error rates, and action distribution.
    Admins view system-wide stats; regular users view their own activity stats.
    """
    since = datetime.utcnow() - timedelta(days=days)
    base_q = db.query(AuditLog).filter(AuditLog.created_at >= since)

    if not current_user.is_admin:
        base_q = base_q.filter(AuditLog.user_id == current_user.id)

    all_logs = base_q.all()
    total = len(all_logs)
    quota_count = sum(1 for l in all_logs if l.action == "quota_exceeded")
    completed_count = sum(1 for l in all_logs if l.action == "collection_completed")
    failed_count = sum(1 for l in all_logs if is_error_action(l.action))
    success_count = max(0, total - failed_count)
    error_rate = round((failed_count / total * 100.0), 1) if total > 0 else 0.0

    if current_user.is_admin:
        active_users = len({l.username for l in all_logs if l.username and not l.username.startswith("system")})
    else:
        active_users = 1 if total > 0 else 0

    quota_logs = [l for l in all_logs if l.action == "quota_exceeded"]
    quota_logs.sort(key=lambda x: x.created_at, reverse=True)
    recent_reason = None
    recent_source = None
    if quota_logs and quota_logs[0].detail:
        recent_reason = quota_logs[0].detail.get("reason")
        recent_source = quota_logs[0].detail.get("source")

    # Daily timeline
    today = datetime.utcnow().date()
    day_counts = {}
    for i in range(days - 1, -1, -1):
        d_str = (today - timedelta(days=i)).isoformat()
        day_counts[d_str] = {"total": 0, "success": 0, "error": 0}

    for log in all_logs:
        if log.created_at:
            d_str = log.created_at.date().isoformat()
            if d_str in day_counts:
                day_counts[d_str]["total"] += 1
                if is_error_action(log.action):
                    day_counts[d_str]["error"] += 1
                else:
                    day_counts[d_str]["success"] += 1

    daily_timeline = [
        DailyActivityStat(date=d_str, total=stats["total"], success=stats["success"], error=stats["error"])
        for d_str, stats in day_counts.items()
    ]

    # Action distribution
    action_counter = {}
    for log in all_logs:
        act = log.action or "unknown"
        action_counter[act] = action_counter.get(act, 0) + 1

    action_distribution = [
        ActionDistributionStat(
            action=act,
            label=ACTION_LABELS.get(act, act.replace("_", " ").title()),
            count=count,
            percentage=round(count / total * 100.0, 1) if total > 0 else 0.0
        )
        for act, count in sorted(action_counter.items(), key=lambda x: x[1], reverse=True)
    ]

    return AuditStatsSummary(
        total_events=total,
        quota_exceeded_count=quota_count,
        collection_completed_count=completed_count,
        failed_count=failed_count,
        success_count=success_count,
        error_rate_percent=error_rate,
        active_users_count=active_users,
        most_recent_quota_error=recent_reason,
        most_recent_quota_source=recent_source,
        daily_timeline=daily_timeline,
        action_distribution=action_distribution,
    )

