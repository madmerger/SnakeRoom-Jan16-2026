from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    age: int = Field(..., ge=0, le=150)
    annual_income: float = Field(..., ge=0)
    total_assets: float = Field(..., ge=0)
    investment_experience: int = Field(0, ge=0)
    risk_tolerance: str = Field("moderate", pattern="^(conservative|moderate|aggressive)$")
    family_size: int = Field(1, ge=1)
    life_plan_notes: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    age: Optional[int] = Field(None, ge=0, le=150)
    annual_income: Optional[float] = Field(None, ge=0)
    total_assets: Optional[float] = Field(None, ge=0)
    investment_experience: Optional[int] = Field(None, ge=0)
    risk_tolerance: Optional[str] = Field(None, pattern="^(conservative|moderate|aggressive)$")
    family_size: Optional[int] = Field(None, ge=1)
    life_plan_notes: Optional[str] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    age: int
    annual_income: float
    total_assets: float
    investment_experience: int
    risk_tolerance: str
    family_size: int
    life_plan_notes: Optional[str]
    created_by: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
