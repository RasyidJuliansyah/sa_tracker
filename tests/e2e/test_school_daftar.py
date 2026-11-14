"""Layar Sekolah – Daftar (Figma 22:320). Data tiruan di sisi klien."""
import re

from playwright.sync_api import Page, expect

URL = "/sekolah?as=manager"


def pilih(page: Page, nama_field: str, opsi: str) -> None:
    combo = page.get_by_role("combobox", name=nama_field)
    option = page.get_by_role("option", name=opsi, exact=True)
    for _ in range(3):
        page.evaluate("window.scrollTo(0, 0)")
        combo.click(force=True)
        try:
            option.wait_for(state="visible", timeout=1500)
            break
        except Exception:
            continue
    option.click()
    expect(page.get_by_role("listbox")).to_have_count(0)


def test_ringkasan_dan_halaman_pertama(page: Page) -> None:
    page.goto(URL)
    expect(page.get_by_text("15 sekolah klien")).to_be_visible()
    expect(page.get_by_text("4 tanpa agent · 3 kontrak berakhir belum diperpanjang")).to_be_visible()
    expect(page.locator("tbody tr")).to_have_count(10)
    expect(page.get_by_text("1–10 dari 15")).to_be_visible()


def test_pagination_ke_halaman_dua(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Halaman berikutnya").click()
    expect(page.locator("tbody tr")).to_have_count(5)
    expect(page.get_by_text("11–15 dari 15")).to_be_visible()


def test_cari_dan_filter(page: Page) -> None:
    page.goto(URL)
    page.locator("#f-cari").fill("20228801")
    expect(page.locator("tbody tr")).to_have_count(1)
    expect(page.locator("tbody")).to_contain_text("SD Cahaya Ilmu Depok")
    page.locator("#f-cari").fill("")
    pilih(page, "Agent", "Tanpa agent")
    expect(page.locator("tbody tr")).to_have_count(4)
    pilih(page, "Jenjang", "SD")
    expect(page.locator("tbody tr")).to_have_count(1)
    pilih(page, "Jenjang", "SMK")
    expect(page.get_by_text("Sekolah tidak ditemukan")).to_be_visible()


def test_klik_baris_membuka_halaman_sekolah(page: Page) -> None:
    page.goto(URL)
    page.get_by_text("SD Cahaya Ilmu Depok").first.click()
    expect(page).to_have_url(re.compile(r"/sekolah/4(\?.*)?$"))
