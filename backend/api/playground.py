from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import time

from database import get_db
from models.skill import Skill
from services.security_scanner import SecurityScanner

router = APIRouter(prefix="/playground", tags=["Playground"])

class SimulateRequest(BaseModel):
    skill_id: Optional[int] = None
    skill_slug: Optional[str] = None
    prompt: str
    target_ide: str = "antigravity"
    model: str = "gemini-2.5-pro"

class SimulateResponse(BaseModel):
    skill_name: str
    target_ide: str
    prompt: str
    before_code: str
    after_code: str
    applied_rules: List[str]
    improvements: List[str]
    security_verdict: Dict[str, Any]
    latency_ms: int

@router.post("/simulate", response_model=SimulateResponse)
def simulate_skill_prompt(data: SimulateRequest, db: Session = Depends(get_db)):
    skill = None
    if data.skill_id:
        skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    elif data.skill_slug:
        skill = db.query(Skill).filter(Skill.name.ilike(f"%{data.skill_slug}%")).first()
        
    if not skill:
        skill = db.query(Skill).order_by(Skill.trending_score.desc()).first()

    skill_name = skill.name if skill else "Generic AI Agent"
    category = skill.category if skill else "coding-agent"
    primary_lang = (skill.primary_language if skill else "Go").lower()
    
    start_time = time.time()

    # Dynamic simulated outputs tailored to skill and prompt
    prompt_lower = data.prompt.lower()

    if "go" in prompt_lower or primary_lang == "go" or "golang" in prompt_lower:
        before_code = """// Standard unoptimized Go code
package main

import "fmt"

func processItems(items []string) {
    for _, item := range items {
        go func() {
            fmt.Println("Processing:", item) // Race condition & goroutine leak!
        }()
    }
}"""
        after_code = """// Optimized with Idiomatic Go & Concurrency Safety
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// ProcessItems safely processes slices concurrently with bounded concurrency & context cancellation.
func ProcessItems(ctx context.Context, items []string, maxConcurrency int) error {
    if maxConcurrency <= 0 {
        maxConcurrency = 5
    }
    
    sem := make(chan struct{}, maxConcurrency)
    var wg sync.WaitGroup
    errCh := make(chan error, len(items))

    for _, item := range items {
        select {
        case <-ctx.Done():
            return ctx.Err()
        case sem <- struct{}{}:
        }

        wg.Add(1)
        go func(val string) {
            defer func() {
                <-sem
                wg.Done()
            }()
            
            // Deterministic processing with error handling
            if err := executeTask(ctx, val); err != nil {
                errCh <- fmt.Errorf("task %s failed: %w", val, err)
            }
        }(item)
    }

    wg.Wait()
    close(errCh)
    
    if len(errCh) > 0 {
        return <-errCh
    }
    return nil
}"""
        applied_rules = [
            "Uber Go Style Guide & Idiomatic Error Handling",
            "Goroutine leak prevention with sync.WaitGroup and worker bounds",
            "Context propagation (`context.Context`) for graceful termination",
            "Race condition elimination in closures (`go func(val string)`)"
        ]
        improvements = [
            "Fixed data race on loop variables",
            "Added bounded semaphore channel to prevent OOM memory exhaustion",
            "Standardized table-driven unit test compatibility"
        ]

    elif "ui" in prompt_lower or "design" in prompt_lower or "react" in prompt_lower:
        before_code = """// Standard unstyled component
export function UserProfileCard({ user }) {
  return (
    <div style={{ padding: '20px', border: '1px solid gray' }}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={() => alert('Clicked')}>Follow</button>
    </div>
  );
}"""
        after_code = """// Transformed with UI/UX Pro Max Design System & Accessibility
import React from 'react';
import { UserCheck, Mail, Sparkles } from 'lucide-react';

interface UserProfileCardProps {
  user: {
    name: string;
    email: string;
    role?: string;
    avatarUrl?: string;
  };
  onFollow?: () => void;
  isFollowing?: boolean;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onFollow,
  isFollowing = false,
}) => {
  return (
    <div className="group p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-base shadow-md group-hover:scale-105 transition-transform">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            {user.name}
            {user.role === 'admin' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                Admin
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">{user.email}</span>
          </p>
        </div>
      </div>

      <button
        onClick={onFollow}
        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
          isFollowing
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
        }`}
      >
        {isFollowing ? <UserCheck className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
        {isFollowing ? 'Following' : 'Connect'}
      </button>
    </div>
  );
};"""
        applied_rules = [
            "WCAG 2.1 AA Contrast Ratios & Dark Mode Tokens",
            "8pt Spatial Grid Layout & Rounded-3xl Micro-interactions",
            "Strict TypeScript Interface & Error Boundary Safety"
        ]
        improvements = [
            "Converted to responsive Tailwind tokens",
            "High contrast readability in dark/light themes",
            "Smooth hover physics and active tap micro-animations"
        ]

    else:
        before_code = f"""// Basic AI generated code for: {data.prompt}
async function handleRequest(req, res) {{
  const data = req.body;
  const result = await db.query("SELECT * FROM items WHERE id = " + data.id); // SQL Injection!
  res.json(result);
}}"""
        after_code = f"""// Enforced with Antigravity / Codex Security & Quality Rules
import {{ z }} from 'zod';
import {{ db }} from './database';

const RequestSchema = z.object({{
  id: z.string().uuid(),
  limit: z.number().int().min(1).max(100).default(20),
}});

export async function handleRequest(req: Request): Promise<Response> {{
  try {{
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    // Parameterized query defense against SQL Injection
    const result = await db.query(
      'SELECT id, name, status, created_at FROM items WHERE id = $1 LIMIT $2',
      [validated.id, validated.limit]
    );

    return Response.json({{ success: true, data: result }});
  }} catch (err) {{
    if (err instanceof z.ZodError) {{
      return Response.json({{ error: 'Validation failed', details: err.errors }}, {{ status: 400 }});
    }}
    return Response.json({{ error: 'Internal Server Error' }}, {{ status: 500 }});
  }}
}}"""
        applied_rules = [
            "Strict Zod Schema Input Sanitization",
            "Parameterized Query Defense (CWE-89 SQL Injection Prevention)",
            "Deterministic HTTP Status Codes & Error Boundary Handlers"
        ]
        improvements = [
            "Eliminated critical SQL injection vulnerability",
            "Added runtime schema validation",
            "Full TypeScript type-safety"
        ]

    latency = int((time.time() - start_time) * 1000) + 120

    security_report = SecurityScanner.scan_skill(skill) if skill else {"security_rating": "safe", "security_score": 98.0}

    return SimulateResponse(
        skill_name=skill_name,
        target_ide=data.target_ide,
        prompt=data.prompt,
        before_code=before_code.strip(),
        after_code=after_code.strip(),
        applied_rules=applied_rules,
        improvements=improvements,
        security_verdict=security_report,
        latency_ms=latency
    )
