"""Halaman login mengikuti desain Figma (SA → 01 Umum → Login).

Butuh frontend berjalan di http://localhost:3010. Login ke backend belum tersambung (langkah 4),
jadi tes ini hanya memeriksa tampilan dan validasi sisi klien.
"""
from playwright.sync_api import Page, expect


def test_desktop_menampilkan_panel_merek_dan_form(page: Page) -> None:
    page.set_viewport_size({"width": 1440, "height": 1024})
    page.goto("/login")
    expect(page.get_by_text("Service Account Visit Tracker")).to_be_visible()
    expect(page.get_by_role("heading", name="Masuk")).to_be_visible()
    expect(page.get_by_text("Lupa password? Minta admin untuk reset.")).to_be_visible()
    card = page.get_by_test_id("login-card").bounding_box()
    assert card["width"] == 482
    # Field setinggi 42px
    assert page.locator("#login-email").locator("xpath=ancestor::div[contains(concat(' ',normalize-space(@class),' '),' v-field ')][1]").bounding_box()["height"] == 42


def test_hp_menyembunyikan_panel_merek(page: Page) -> None:
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto("/login")
    expect(page.get_by_text("Untuk tim service account Skolla")).to_be_hidden()
    expect(page.get_by_text("Visit Tracker", exact=True)).to_be_visible()


def test_tombol_mata_menampilkan_password(page: Page) -> None:
    page.goto("/login")
    page.fill("#login-password", "rahasia123")
    expect(page.locator("#login-password")).to_have_attribute("type", "password")
    page.get_by_role("button", name="Tampilkan password").click()
    expect(page.locator("#login-password")).to_have_attribute("type", "text")
    expect(page.get_by_role("button", name="Sembunyikan password")).to_be_visible()


def test_validasi_form_kosong_dan_email_salah(page: Page) -> None:
    page.goto("/login")
    page.get_by_test_id("login-submit").click()
    expect(page.get_by_text("Email kantor wajib diisi")).to_be_visible()
    expect(page.get_by_text("Password wajib diisi")).to_be_visible()
    page.fill("#login-email", "bukan-email")
    page.fill("#login-password", "x")
    page.get_by_test_id("login-submit").click()
    expect(page.get_by_text("Format email tidak valid")).to_be_visible()
