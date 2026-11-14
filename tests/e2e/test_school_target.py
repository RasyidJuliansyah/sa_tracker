"""Layar Target retention (Figma 23:1633). Data tiruan di sisi klien."""
from playwright.sync_api import Page, expect

URL = "/target-retention?as=manager"


def pilih(page: Page, field_id: str, opsi: str) -> None:
    option = page.get_by_role("option", name=opsi, exact=True)
    for _ in range(3):
        page.locator(f"#{field_id}").click(force=True)
        try:
            option.wait_for(state="visible", timeout=1500)
            break
        except Exception:
            continue
    option.click()


def test_tabel_tiga_tahun_sesuai_figma(page: Page) -> None:
    page.goto(URL)
    rows = page.get_by_test_id("target-row")
    expect(rows).to_have_count(3)
    expect(rows.nth(0)).to_contain_text("2027")
    expect(rows.nth(0)).to_contain_text("Default")
    expect(rows.nth(0)).to_contain_text("Rp 897 jt")
    expect(rows.nth(1)).to_contain_text("59,8%")
    expect(rows.nth(2)).to_contain_text("Sesuai target")
    expect(page.get_by_role("heading", name="Ubah target 2027")).to_be_visible()


def test_ubah_target_tahun_2027(page: Page) -> None:
    page.goto(URL)
    page.fill("#tg-percent", "70")
    page.get_by_role("button", name="Simpan target").click()
    row = page.get_by_test_id("target-row").nth(0)
    expect(row).to_contain_text("70%")
    expect(row).to_contain_text("Rp 966 jt")
    expect(row).not_to_contain_text("Default")


def test_target_tidak_sah_ditolak(page: Page) -> None:
    page.goto(URL)
    for nilai in ["0", "101", "abc", ""]:
        page.fill("#tg-percent", nilai)
        page.get_by_role("button", name="Simpan target").click()
        expect(page.get_by_text("Persentase target harus lebih dari 0 dan paling banyak 100")).to_be_visible()
    expect(page.get_by_test_id("target-row").nth(0)).to_contain_text("65%")


def test_ganti_tahun_mengisi_persentase_tahun_itu(page: Page) -> None:
    page.goto(URL)
    pilih(page, "tg-year", "2025")
    expect(page.get_by_role("heading", name="Ubah target 2025")).to_be_visible()
    expect(page.locator("#tg-percent")).to_have_value("60")
    page.fill("#tg-percent", "62,5")
    page.get_by_role("button", name="Simpan target").click()
    expect(page.get_by_test_id("target-row").nth(2)).to_contain_text("62,5%")
