from datetime import datetime

from pydantic import BaseModel


class SuitabilityRequest(BaseModel):
    customer_id: int
    product_id: int


class SuitabilityResponse(BaseModel):
    id: int
    customer_id: int
    product_id: int
    score: float
    reasons: list[str]
    is_suitable: bool
    calculated_by: int
    calculated_at: datetime

    model_config = {"from_attributes": True}


class RecommendationItem(BaseModel):
    product_id: int
    product_name: str
    category: str
    risk_level: int
    score: float
    reasons: list[str]
    is_suitable: bool


class RecommendationResponse(BaseModel):
    customer_id: int
    customer_name: str
    recommendations: list[RecommendationItem]
