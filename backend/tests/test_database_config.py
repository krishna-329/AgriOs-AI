import pytest
from sqlalchemy.engine import make_url
from app.config import resolve_database_url

@pytest.mark.parametrize("value", [None, "", "   ", "sqlite:///local.db", "sqlite:////tmp/agrios.db"])
def test_production_never_uses_sqlite(value):
    with pytest.raises(ValueError): resolve_database_url(value, True)

def test_local_sqlite_default():
    assert resolve_database_url(None, False) == "sqlite:///./agrios.db"

@pytest.mark.parametrize("scheme", ["postgres", "postgresql", "postgresql+psycopg"])
def test_provider_urls_use_installed_driver(scheme):
    url = make_url(resolve_database_url(f"{scheme}://host/db?sslmode=require", True))
    assert url.drivername == "postgresql+psycopg" and url.query["sslmode"] == "require"

@pytest.mark.parametrize("query", ["", "?sslmode=disable", "?sslmode=prefer"])
def test_production_requires_tls(query):
    with pytest.raises(ValueError): resolve_database_url(f"postgresql://host/db{query}", True)

def test_invalid_url_error_does_not_echo_input():
    with pytest.raises(ValueError) as error: resolve_database_url("invalid-sensitive-value", True)
    assert "invalid-sensitive-value" not in str(error.value)
