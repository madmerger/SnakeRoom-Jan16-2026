"""Seed script to populate initial product data and a demo admin user."""

from app.database import SessionLocal, Base, engine
from app.models import Product, User
from app.services.auth import hash_password


SEED_PRODUCTS = [
    {
        "name": "定期預金",
        "category": "預金",
        "risk_level": 1,
        "min_investment_amount": 100000,
        "fee_rate": 0.0,
        "description": "元本保証の定期預金。安定した資産運用に適しています。",
    },
    {
        "name": "国債ファンド",
        "category": "投資信託",
        "risk_level": 2,
        "min_investment_amount": 500000,
        "fee_rate": 0.003,
        "description": "国債を中心に運用する低リスクファンド。",
    },
    {
        "name": "バランス型投資信託",
        "category": "投資信託",
        "risk_level": 3,
        "min_investment_amount": 1000000,
        "fee_rate": 0.01,
        "description": "株式と債券をバランスよく組み合わせた中リスクファンド。",
    },
    {
        "name": "株式型投資信託",
        "category": "投資信託",
        "risk_level": 4,
        "min_investment_amount": 1000000,
        "fee_rate": 0.015,
        "description": "国内外の株式を中心に運用する高リスク・高リターンファンド。",
    },
    {
        "name": "外国株式ファンド",
        "category": "投資信託",
        "risk_level": 5,
        "min_investment_amount": 2000000,
        "fee_rate": 0.02,
        "description": "海外の成長株式に投資する最高リスクファンド。",
    },
    {
        "name": "終身保険",
        "category": "保険",
        "risk_level": 2,
        "min_investment_amount": 300000,
        "fee_rate": 0.0,
        "description": "一生涯の保障を提供する生命保険商品。",
    },
    {
        "name": "住宅ローン",
        "category": "ローン",
        "risk_level": 1,
        "min_investment_amount": 0,
        "fee_rate": 0.005,
        "description": "住宅購入のための長期ローン。",
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Product).count() == 0:
            for product_data in SEED_PRODUCTS:
                db.add(Product(**product_data))
            print(f"✓ {len(SEED_PRODUCTS)}件の商品データを投入しました")

        if db.query(User).count() == 0:
            admin = User(
                email="admin@example.com",
                hashed_password=hash_password("admin123"),
                name="管理者",
                role="管理者",
            )
            sales = User(
                email="tanaka@example.com",
                hashed_password=hash_password("tanaka123"),
                name="田中太郎",
                role="営業員",
            )
            db.add_all([admin, sales])
            print("✓ デモユーザー（管理者・営業員）を作成しました")

        db.commit()
        print("✓ シードデータの投入が完了しました")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
