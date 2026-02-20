from decimal import Decimal, ROUND_HALF_UP

CURRENCY_EXPONENT = {
    "NGN": 2,
    "GHS": 2,
    "USD": 2,
    "GBP": 2,
    "EUR": 2,
    "XOF": 0,
    "XAF": 0,
}


def _scale(currency: str) -> Decimal:
    exponent = CURRENCY_EXPONENT[currency]
    return Decimal(10) ** exponent


def quantize_major(amount_major: Decimal, currency: str) -> Decimal:
    exponent = CURRENCY_EXPONENT[currency]
    quant = Decimal("1") if exponent == 0 else Decimal("1") / (Decimal(10) ** exponent)
    return Decimal(amount_major).quantize(quant, rounding=ROUND_HALF_UP)


def to_major(amount_minor: int, currency: str) -> Decimal:
    return quantize_major(Decimal(amount_minor) / _scale(currency), currency)


def to_minor(amount_major: Decimal, currency: str) -> int:
    major = quantize_major(Decimal(amount_major), currency)
    return int((major * _scale(currency)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
