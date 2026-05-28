from typing import Any, Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., pattern="^(投資信託|保険|ローン|預金)$")
    risk_level: int = Field(..., ge=1, le=5)
    min_investment_amount: float = Field(0, ge=0)
    fee_rate: float = Field(0, ge=0, le=1)
    description: Optional[str] = None
    conditions: Optional[dict[str, Any]] = None
    is_active: bool = True


class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    risk_level: int
    min_investment_amount: float
    fee_rate: float
    description: Optional[str]
    conditions: Optional[dict[str, Any]]
    is_active: bool

    model_config = {"from_attributes": True}
