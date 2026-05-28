from dataclasses import dataclass


@dataclass
class CustomerProfile:
    age: int
    annual_income: float
    total_assets: float
    investment_experience: int
    risk_tolerance: str  # conservative, moderate, aggressive


@dataclass
class ProductProfile:
    risk_level: int  # 1-5
    min_investment_amount: float


@dataclass
class ScoringResult:
    score: float
    reasons: list[str]
    is_suitable: bool


RISK_TOLERANCE_MAP = {
    "conservative": 1,
    "moderate": 3,
    "aggressive": 5,
}


def _score_risk_tolerance(customer: CustomerProfile, product: ProductProfile) -> tuple[float, str | None]:
    tolerance_level = RISK_TOLERANCE_MAP.get(customer.risk_tolerance, 3)
    gap = abs(product.risk_level - tolerance_level)
    if gap == 0:
        return 0, None
    penalty = gap * 15
    reason = (
        f"リスク許容度（{customer.risk_tolerance}）と商品リスクレベル（{product.risk_level}）の"
        f"乖離が{gap}あります"
    )
    return penalty, reason


def _score_experience(customer: CustomerProfile, product: ProductProfile) -> tuple[float, str | None]:
    if product.risk_level >= 4 and customer.investment_experience < 3:
        penalty = (3 - customer.investment_experience) * 10
        reason = (
            f"投資経験が{customer.investment_experience}年と少ないため、"
            f"リスクレベル{product.risk_level}の商品には不適合です"
        )
        return penalty, reason
    if product.risk_level >= 3 and customer.investment_experience < 1:
        reason = "投資経験がないため、中リスク以上の商品には注意が必要です"
        return 10, reason
    return 0, None


def _score_investment_ratio(customer: CustomerProfile, product: ProductProfile) -> tuple[float, str | None]:
    if customer.total_assets <= 0:
        if product.min_investment_amount > 0:
            return 50, "総資産が0のため、投資商品は不適合です"
        return 0, None
    ratio = product.min_investment_amount / customer.total_assets
    if ratio > 0.5:
        reason = (
            f"最低投資額が総資産の{ratio:.0%}を占めており、資産に対して投資額が大きすぎます"
        )
        return 50, reason
    if ratio > 0.3:
        reason = (
            f"最低投資額が総資産の{ratio:.0%}を占めており、やや高い比率です"
        )
        return 20, reason
    return 0, None


def _score_age(customer: CustomerProfile, product: ProductProfile) -> tuple[float, str | None]:
    if customer.age >= 70 and product.risk_level >= 4:
        reason = f"年齢が{customer.age}歳のため、高リスク商品（レベル{product.risk_level}）は追加減点されます"
        return 20, reason
    if customer.age >= 70 and product.risk_level >= 3:
        reason = f"年齢が{customer.age}歳のため、中リスク以上の商品には注意が必要です"
        return 10, reason
    return 0, None


def calculate_suitability_score(
    customer: CustomerProfile, product: ProductProfile
) -> ScoringResult:
    base_score = 100.0
    reasons: list[str] = []

    rules = [
        _score_risk_tolerance,
        _score_experience,
        _score_investment_ratio,
        _score_age,
    ]

    for rule in rules:
        penalty, reason = rule(customer, product)
        base_score -= penalty
        if reason:
            reasons.append(reason)

    score = max(0, min(100, base_score))
    is_suitable = score >= 60

    return ScoringResult(score=score, reasons=reasons, is_suitable=is_suitable)
