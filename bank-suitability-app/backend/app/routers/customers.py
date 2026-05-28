from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Customer, User
from app.schemas.customer import CustomerCreate, CustomerResponse, CustomerUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[CustomerResponse])
def list_customers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(Customer).all()


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = Customer(**data.model_dump(), created_by=current_user.id)
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="顧客が見つかりません")
    return customer


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="顧客が見つかりません")
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    db.commit()
    db.refresh(customer)
    return customer
