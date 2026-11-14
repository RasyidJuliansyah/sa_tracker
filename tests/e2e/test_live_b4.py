"""E2E terhadap backend sungguhan (B3-B4). Dilewati kecuali LIVE_E2E=1.

Jalankan: backend (CORS_ORIGIN = alamat frontend, database dev ber-seed), frontend TANPA dev:mock,
lalu `LIVE_E2E=1 .venv/bin/pytest tests/e2e/test_live_b4.py --base-url http://localhost:3012`.
Password seed semua akun: lihat backend/prisma/seed.ts.
"""
import os
import re
import time

import pytest
from playwright.sync_api import Page, expect

pytestmark = pytest.mark.skipif(os.environ.get("LIVE_E2E") != "1", reason="butuh backend sungguhan")
PW = os.environ.get("SEED_PASSWORD", "Password123!")


def login(page: Page, email: str, password: str = PW) -> None:
    page.goto("/login")
    page.fill("#login-email", email)
    page.fill("#login-password", password)
    page.get_by_test_id("login-submit").click()
    expect(page).not_to_have_url(re.compile(r"/login$"), timeout=10000) if password == PW else None


def test_login_salah_menampilkan_galat(page: Page) -> None:
    login(page, "admin@skolla.test", "salah-salah")
    expect(page.get_by_test_id("login-alert")).to_be_visible()
    expect(page).to_have_url(re.compile(r"/login$"))


def test_tanpa_login_dialihkan_ke_login(page: Page) -> None:
    page.goto("/akun")
    expect(page).to_have_url(re.compile(r"/login$"))


def test_admin_login_lalu_kelola_akun(page: Page) -> None:
    login(page, "admin@skolla.test")
    expect(page).to_have_url(re.compile(r"/akun$"))
    expect(page.get_by_text("Admin Skolla").first).to_be_visible()
    email = f"uji{int(time.time())}@skolla.test"
    page.get_by_role("button", name="Tambah akun").click()
    page.fill("#acc-name", "Akun Uji Live")
    page.fill("#acc-email", email)
    page.get_by_role("button", name="Buat akun").click()
    expect(page.get_by_text(email)).to_be_visible()


def test_admin_master_data_dan_audit_log(page: Page) -> None:
    login(page, "admin@skolla.test")
    page.goto("/master-data")
    expect(page.get_by_text("SMP", exact=True).first).to_be_visible()
    page.goto("/audit-log")
    expect(page.get_by_text("Login").first).to_be_visible()


def test_manager_akun_agent_dan_pembatasan_rute(page: Page) -> None:
    login(page, "manager@skolla.test")
    expect(page).to_have_url(re.compile(r"/dashboard$"))
    page.goto("/akun-agent")
    expect(page.get_by_text("Citra Agent")).to_be_visible()
    page.goto("/akun")  # khusus admin
    expect(page).to_have_url(re.compile(r"/dashboard$"))


def test_agent_dialihkan_ke_beranda_agent(page: Page) -> None:
    login(page, "citra@skolla.test")
    expect(page).to_have_url(re.compile(r"/agent$"))
    page.goto("/audit-log")
    expect(page).to_have_url(re.compile(r"/agent$"))
