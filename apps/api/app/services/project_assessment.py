from __future__ import annotations

from datetime import datetime
from io import BytesIO
from textwrap import wrap

from sqlalchemy.orm import Session

from app.db.models import ProjectAssessment, User


DEFAULT_RUBRIC = {
    "correctness": 35,
    "readability": 20,
    "testing": 20,
    "architecture": 15,
    "documentation": 10,
}


class ProjectAssessmentService:
    def evaluate_submission(self, submission_md: str, rubric: dict | None = None) -> tuple[int, dict]:
        rubric_weights = rubric or DEFAULT_RUBRIC
        text = submission_md.lower()

        correctness = 85 if "output" in text or "result" in text else 65
        readability = 85 if "def " in text and "class " in text else 70
        testing = 85 if "test" in text or "pytest" in text else 55
        architecture = 80 if "module" in text or "service" in text else 60
        documentation = 90 if "readme" in text or "#" in submission_md else 60

        scores = {
            "correctness": correctness,
            "readability": readability,
            "testing": testing,
            "architecture": architecture,
            "documentation": documentation,
        }
        final_score = int(
            sum(scores[key] * (rubric_weights.get(key, 0) / 100) for key in scores)
        )

        feedback = {
            "strengths": [
                "Good structure and intent clarity." if readability >= 80 else "Clear problem framing.",
                "Solid documentation hygiene." if documentation >= 80 else "Consider adding more comments and docs.",
            ],
            "improvements": [
                "Add explicit tests for edge cases." if testing < 75 else "Expand test coverage with parameterized cases.",
                "Separate business logic from IO paths for cleaner architecture." if architecture < 75 else "Great architecture baseline; consider dependency inversion.",
            ],
        }

        return final_score, {"scores": scores, "feedback": feedback}

    def build_portfolio_readme(
        self,
        title: str,
        score: int,
        feedback_json: dict,
        submission_md: str,
    ) -> str:
        strengths = feedback_json.get("feedback", {}).get("strengths", [])
        improvements = feedback_json.get("feedback", {}).get("improvements", [])
        strength_lines = [f"- {item}" for item in strengths] or ["- Baseline implementation submitted."]
        improvement_lines = [f"- {item}" for item in improvements] or ["- Add deeper technical test coverage."]
        return "\n".join(
            [
                f"# {title}",
                "",
                "## Project Assessment",
                f"- Score: **{score}/100**",
                f"- Generated: {datetime.utcnow().isoformat()} UTC",
                "",
                "## Strengths",
                *strength_lines,
                "",
                "## Improvement Plan",
                *improvement_lines,
                "",
                "## Submission Snapshot",
                "```markdown",
                submission_md[:2000],
                "```",
            ]
        )

    def _escape_pdf_text(self, text: str) -> str:
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    def export_simple_pdf(self, title: str, content: str) -> bytes:
        # Minimal single-page PDF writer to avoid external dependencies.
        lines = [title] + [""] + [line for paragraph in content.splitlines() for line in (wrap(paragraph, 90) or [""])]
        lines = lines[:42]
        y = 780
        commands: list[str] = ["BT", "/F1 11 Tf", "50 800 Td"]
        for line in lines:
            escaped = self._escape_pdf_text(line)
            commands.append(f"({escaped}) Tj")
            commands.append(f"0 -16 Td")
            y -= 16
            if y < 80:
                break
        commands.append("ET")
        stream = "\n".join(commands).encode("latin-1", errors="ignore")

        objects = [
            b"<< /Type /Catalog /Pages 2 0 R >>",
            b"<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
            b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            f"<< /Length {len(stream)} >>\nstream\n".encode("latin-1") + stream + b"\nendstream",
        ]

        out = BytesIO()
        out.write(b"%PDF-1.4\n")
        offsets = [0]
        for idx, obj in enumerate(objects, start=1):
            offsets.append(out.tell())
            out.write(f"{idx} 0 obj\n".encode("latin-1"))
            out.write(obj)
            out.write(b"\nendobj\n")

        xref_start = out.tell()
        out.write(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
        out.write(b"0000000000 65535 f \n")
        for offset in offsets[1:]:
            out.write(f"{offset:010d} 00000 n \n".encode("latin-1"))
        out.write(
            (
                f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
                f"startxref\n{xref_start}\n%%EOF"
            ).encode("latin-1")
        )
        return out.getvalue()

    def create_assessment(
        self,
        db: Session,
        user: User,
        title: str,
        submission_md: str,
        rubric_json: dict | None = None,
        lesson_id: int | None = None,
    ) -> ProjectAssessment:
        score, feedback_json = self.evaluate_submission(submission_md, rubric_json)
        portfolio_readme = self.build_portfolio_readme(title, score, feedback_json, submission_md)

        record = ProjectAssessment(
            user_id=user.id,
            lesson_id=lesson_id,
            title=title,
            submission_md=submission_md,
            rubric_json=rubric_json or DEFAULT_RUBRIC,
            score=score,
            feedback_json=feedback_json,
            portfolio_readme_md=portfolio_readme,
        )
        db.add(record)
        db.flush()
        return record


project_assessment_service = ProjectAssessmentService()
