from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="営業員")

    customers: Mapped[list["Customer"]] = relationship(back_populates="creator")
    suitability_results: Mapped[list["SuitabilityResult"]] = relationship(back_populates="calculator")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    annual_income: Mapped[float] = mapped_column(Float, nullable=False)
    total_assets: Mapped[float] = mapped_column(Float, nullable=False)
    investment_experience: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    risk_tolerance: Mapped[str] = mapped_column(String(50), nullable=False, default="moderate")
    family_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    life_plan_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    creator: Mapped["User"] = relationship(back_populates="customers")
    suitability_results: Mapped[list["SuitabilityResult"]] = relationship(back_populates="customer")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    risk_level: Mapped[int] = mapped_column(Integer, nullable=False)
    min_investment_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    fee_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    conditions: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    suitability_results: Mapped[list["SuitabilityResult"]] = relationship(back_populates="product")


class SuitabilityResult(Base):
    __tablename__ = "suitability_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    reasons: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    is_suitable: Mapped[bool] = mapped_column(Boolean, nullable=False)
    calculated_by: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer: Mapped["Customer"] = relationship(back_populates="suitability_results")
    product: Mapped["Product"] = relationship(back_populates="suitability_results")
    calculator: Mapped["User"] = relationship(back_populates="suitability_results")
