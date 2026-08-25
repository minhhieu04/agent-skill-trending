import re
from typing import Dict, Any, List
from models.skill import Skill

DANGEROUS_PATTERNS = [
    (r"rm\s+-rf\s+/", "Dangerous root deletion command detected", "high"),
    (r"curl\s+.*\|\s*(ba)?sh", "Unverified pipe-to-shell execution", "high"),
    (r"chmod\s+777", "Insecure global write/exec permissions", "moderate"),
    (r"eval\(", "Dynamic arbitrary code evaluation", "moderate"),
    (r"(aws_secret|ghp_|github_pat|private_key)", "Potential token/secret pattern in configuration", "high"),
    (r"sudo\s+", "Privilege escalation request", "moderate"),
    (r"nc\s+-l", "Reverse shell / network listening pattern", "high"),
]

class SecurityScanner:
    @staticmethod
    def scan_skill(skill: Skill) -> Dict[str, Any]:
        """
        Scans skill metadata, use cases, readme, and descriptions for security risks and guardrail compliance.
        """
        combined_text = f"{skill.name} {skill.description or ''} {skill.ai_summary or ''} {skill.readme_preview or ''} {' '.join(skill.use_cases or [])}"
        
        flags: List[Dict[str, str]] = []
        score = 98.0
        
        for pattern, desc, severity in DANGEROUS_PATTERNS:
            if re.search(pattern, combined_text, re.IGNORECASE):
                flags.append({
                    "pattern": pattern,
                    "description": desc,
                    "severity": severity
                })
                if severity == "high":
                    score -= 30.0
                elif severity == "moderate":
                    score -= 15.0

        # Determine permission level
        if "terminal" in combined_text.lower() or "exec" in combined_text.lower() or "bash" in combined_text.lower():
            permission_level = "terminal_exec"
        elif "write" in combined_text.lower() or "edit" in combined_text.lower():
            permission_level = "workspace_write"
        elif "network" in combined_text.lower() or "http" in combined_text.lower() or "fetch" in combined_text.lower():
            permission_level = "network_access"
        else:
            permission_level = "read_only"

        score = max(20.0, min(100.0, score))
        
        if score >= 85.0:
            rating = "safe"
            badge_text = "Verified Safe"
            badge_color = "emerald"
        elif score >= 60.0:
            rating = "moderate"
            badge_text = "Moderate Permissions"
            badge_color = "amber"
        else:
            rating = "caution"
            badge_text = "High Risk Attention"
            badge_color = "rose"

        return {
            "skill_id": skill.id,
            "skill_name": skill.name,
            "security_rating": rating,
            "security_score": round(score, 1),
            "badge_text": badge_text,
            "badge_color": badge_color,
            "permission_level": permission_level,
            "flags_count": len(flags),
            "flags": flags,
            "sandbox_compliant": score >= 70.0,
            "audit_passed": len(flags) == 0,
            "recommendation": "Safe for automated workspace execution." if score >= 85.0 else "Review permissions before enabling unrestricted terminal tool access."
        }
