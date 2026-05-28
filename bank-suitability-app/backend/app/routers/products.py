from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Product, User
from app.schemas.product import ProductCreate, ProductResponse
from app.services.auth import get_current_user, require_admin

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Product).filter(Product.is_active == True).all()  # noqa: E712


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    product = Product(**data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品が見つかりません")
    return product
