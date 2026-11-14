"""Tes asap setup: tema Vuetify, font Rubik, dan locale Indonesia terpasang.

Butuh frontend berjalan di http://localhost:3010 (`npm run dev` di frontend/).
"""
import re

from playwright.sync_api import Page, expect


def test_tema_dan_komponen_dasar(page: Page) -> None:
    page.goto("/")

    # color="primary" berarti brand #040abe, bukan biru bawaan Vuetify
    button = page.get_by_test_id("btn-primary")
    expect(button).to_have_css("background-color", "rgb(4, 10, 190)")
    expect(button).to_have_css("text-transform", "none")

    # Rubik terpasang
    expect(page.locator("h1")).to_have_css("font-family", re.compile("Rubik"))

    # Input setinggi 42px dengan radius 5px
    field = page.get_by_test_id("field").locator(".v-field")
    assert field.bounding_box()["height"] == 42
    expect(field).to_have_css("border-top-left-radius", "5px")


def test_locale_indonesia_di_footer_tabel(page: Page) -> None:
    page.goto("/")
    footer = page.get_by_test_id("table").locator(".v-data-table-footer")
    expect(footer).to_contain_text("Item per halaman")
    expect(footer).not_to_contain_text("Items per page")
