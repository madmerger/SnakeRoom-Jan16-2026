from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, customers, products, suitability

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Mizuho Biz API",
    description="Mizuho Biz - 営業先で顧客にサービスを提案する際の適合性スコアを計算するAPI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(suitability.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
