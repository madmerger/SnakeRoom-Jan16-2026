import pytest

from app.services.scoring import (
    CustomerProfile,
    ProductProfile,
    ScoringResult,
    calculate_suitability_score,
)


def _make_customer(**kwargs) -> CustomerProfile:
    defaults = {
        "age": 40,
        "annual_income": 6_000_000,
        "total_assets": 10_000_000,
        "investment_experience": 5,
        "risk_tolerance": "moderate",
    }
    defaults.update(kwargs)
    return CustomerProfile(**defaults)


def _make_product(**kwargs) -> ProductProfile:
    defaults = {
        "risk_level": 3,
        "min_investment_amount": 1_000_000,
    }
    defaults.update(kwargs)
    return ProductProfile(**defaults)


class TestScoringEngine:
    def test_perfect_match(self):
        """Moderate顧客 × リスク3商品 → 高スコア（適合）"""
        customer = _make_customer(risk_tolerance="moderate", investment_experience=5)
        product = _make_product(risk_level=3, min_investment_amount=1_000_000)
        result = calculate_suitability_score(customer, product)
        assert result.score == 100
        assert result.is_suitable is True
        assert len(result.reasons) == 0

    def test_risk_tolerance_mismatch(self):
        """Conservative顧客 × リスク5商品 → リスク乖離で減点"""
        customer = _make_customer(risk_tolerance="conservative")
        product = _make_product(risk_level=5)
        result = calculate_suitability_score(customer, product)
        assert result.score < 100
        assert result.is_suitable is False
        assert any("リスク許容度" in r for r in result.reasons)

    def test_low_experience_high_risk(self):
        """投資経験0年 × リスク5商品 → 経験不足で減点"""
        customer = _make_customer(investment_experience=0)
        product = _make_product(risk_level=5)
        result = calculate_suitability_score(customer, product)
        assert result.score < 100
        assert any("投資経験" in r for r in result.reasons)

    def test_large_investment_ratio(self):
        """総資産100万 × 最低投資額100万 → 投資比率100%で大幅減点"""
        customer = _make_customer(total_assets=1_000_000)
        product = _make_product(min_investment_amount=1_000_000)
        result = calculate_suitability_score(customer, product)
        assert result.score < 100
        assert result.is_suitable is False
        assert any("資産" in r or "投資額" in r for r in result.reasons)

    def test_elderly_high_risk(self):
        """75歳 × リスク5商品 → 年齢追加減点"""
        customer = _make_customer(age=75)
        product = _make_product(risk_level=5)
        result = calculate_suitability_score(customer, product)
        assert result.score < 100
        assert any("年齢" in r for r in result.reasons)

    def test_conservative_low_risk_suitable(self):
        """Conservative顧客 × リスク1商品 → 適合"""
        customer = _make_customer(risk_tolerance="conservative", investment_experience=0, age=80)
        product = _make_product(risk_level=1, min_investment_amount=100_000)
        result = calculate_suitability_score(customer, product)
        assert result.is_suitable is True
        assert result.score >= 60

    def test_score_never_below_zero(self):
        """極端なケースでもスコアは0以上"""
        customer = _make_customer(
            risk_tolerance="conservative",
            investment_experience=0,
            age=90,
            total_assets=100_000,
        )
        product = _make_product(risk_level=5, min_investment_amount=1_000_000)
        result = calculate_suitability_score(customer, product)
        assert result.score >= 0
        assert result.is_suitable is False

    def test_multiple_reasons_accumulated(self):
        """複数ルールに抵触する場合、理由が蓄積される"""
        customer = _make_customer(
            risk_tolerance="conservative",
            investment_experience=0,
            age=75,
            total_assets=500_000,
        )
        product = _make_product(risk_level=5, min_investment_amount=500_000)
        result = calculate_suitability_score(customer, product)
        assert len(result.reasons) >= 3
