from pydantic import BaseModel, EmailStr


class GenerateCertificateRequest(BaseModel):
    track_slug: str | None = None


class CertificateVerificationResponse(BaseModel):
    valid: bool
    certificate_title: str | None = None
    learner_name: str | None = None
    issued_at: str | None = None


class ParentReportRequest(BaseModel):
    parent_email: EmailStr
    report_month: str | None = None


class ParentReportResponse(BaseModel):
    status: str
    parent_email: EmailStr
    report_month: str
