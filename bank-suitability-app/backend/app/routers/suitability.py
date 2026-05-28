from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, Product, SuitabilityResult, User
from app.schemas.suitability import (
    RecommendationItem,
    RecommendationResponse,
    SuitabilityRequest,
    SuitabilityResponse,
)
from app.services.auth import get_current_user
from app.services.scoring import CustomerProfile, ProductProfile, calculate_suitability_score

router = APIRouter(prefix="/suitability", tags=["suitability"])


def _build_profiles(
    customer: Customer, product: Product
) -> tuple[CustomerProfile, ProductProfile]:
    return (
        CustomerProfile(
            age=customer.age,
            annual_income=customer.annual_income,
            total_assets=customer.total_assets,
            investment_experience=customer.investment_experience,
            risk_tolerance=customer.risk_tolerance,
        ),
        ProductProfile(
            risk_level=product.risk_level,
            min_investment_amount=product.min_investment_amount,
        ),
    )


@router.post("/calculate", response_model=SuitabilityResponse, status_code=status.HTTP_201_CREATED)
def calculate(
    req: SuitabilityRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="顧客が見つかりません")

    product = db.query(Product).filter(Product.id == req.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品が見つかりません")

    cust_profile, prod_profile = _build_profiles(customer, product)
    result = calculate_suitability_score(cust_profile, prod_profile)

    db_result = SuitabilityResult(
        customer_id=customer.id,
        product_id=product.id,
        score=result.score,
        reasons=result.reasons,
        is_suitable=result.is_suitable,
        calculated_by=current_user.id,
    )
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result


@router.get("/recommend/{customer_id}", response_model=RecommendationResponse)
def recommend(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="顧客が見つかりません")

    products = db.query(Product).filter(Product.is_active == True).all()  # noqa: E712
    recommendations: list[RecommendationItem] = []

    for product in products:
        cust_profile, prod_profile = _build_profiles(customer, product)
        result = calculate_suitability_score(cust_profile, prod_profile)
        recommendations.append(
            RecommendationItem(
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                risk_level=product.risk_level,
                score=result.score,
                reasons=result.reasons,
                is_suitable=result.is_suitable,
            )
        )

    recommendations.sort(key=lambda x: x.score, reverse=True)

    return RecommendationResponse(
        customer_id=customer.id,
        customer_name=customer.name,
        recommendations=recommendations,
    )
