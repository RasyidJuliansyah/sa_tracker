"""Tes asap tema Vuetify, font Rubik, dan locale Indonesia lewat galeri komponen (/_komponen, hanya dev).

Butuh frontend berjalan di http://localhost:3010 (`npm run dev` di frontend/).
"""
import re

from playwright.sync_api import Page, expect


def test_tema_dan_komponen_dasar(page: Page) -> None:
    page.goto("/_komponen")

    # color="primary" berarti brand #040abe, bukan biru bawaan Vuetify
    primer = page.get_by_role("button", name="Primer")
    expect(primer).to_have_css("background-color", "rgb(4, 10, 190)")
    expect(primer).to_have_css("text-transform", "none")
    assert primer.bounding_box()["height"] == 40

    # Tombol bahaya memakai error-text, bukan merah palet Vuetify
    expect(page.get_by_role("button", name="Bahaya")).to_have_css("background-color", "rgb(176, 27, 19)")

    # Rubik terpasang
    expect(page.locator("h2").first).to_have_css("font-family", re.compile("Rubik"))

    # Input setinggi 42px dengan radius 5px; textarea lebih tinggi dari itu
    field = page.locator("#g1").locator("xpath=ancestor::div[contains(concat(' ',normalize-space(@class),' '),' v-field ')][1]")
    assert field.bounding_box()["height"] == 42
    expect(field).to_have_css("border-top-left-radius", "5px")
    area = page.locator("#g4").locator("xpath=ancestor::div[contains(concat(' ',normalize-space(@class),' '),' v-field ')][1]")
    assert area.bounding_box()["height"] > 100


def test_locale_dan_footer_tabel(page: Page) -> None:
    page.goto("/_komponen")
    footer = page.locator(".table-footer")
    expect(footer).to_contain_text("Baris per halaman")
    expect(footer).to_contain_text("1–10 dari 23")
    page.get_by_role("button", name="Halaman berikutnya").click()
    expect(footer).to_contain_text("11–20 dari 23")


def test_stat_card_menulis_strip_untuk_data_kosong(page: Page) -> None:
    page.goto("/_komponen")
    kartu = page.locator(".stat-card", has_text="Rata-rata durasi")
    expect(kartu.locator(".stat-card__value")).to_have_text("–")
