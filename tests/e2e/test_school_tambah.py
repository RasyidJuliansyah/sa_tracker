"""Layar Tambah sekolah (Figma 22:1164). Data tiruan di sisi klien."""
import re

from playwright.sync_api import Page, expect

URL = "/sekolah/baru?as=manager"


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


def isi_dasar(page: Page, npsn: str) -> None:
    page.fill("#sk-name", "SD Harapan Mulia Bogor")
    page.fill("#sk-npsn", npsn)
    page.fill("#sk-city", "Bogor")
    pilih(page, "sk-level", "SD")
    pilih(page, "sk-pkg", "Standar")
    for field, value in [("sk-coop-start", "2026-12-01"), ("sk-coop-end", "2027-11-30")]:
        page.locator(f"#{field}-native").fill(value)


def isi_kontrak(page: Page, mulai: str = "2026-12-01", berakhir: str = "2027-11-30") -> None:
    page.locator("#sk-signed-native").fill("2026-11-25")
    page.locator("#sk-start-native").fill(mulai)
    page.locator("#sk-end-native").fill(berakhir)
    page.fill("#sk-value", "42000000")


def test_npsn_ganda_ditolak(page: Page) -> None:
    page.goto(URL)
    isi_dasar(page, "20228801")
    isi_kontrak(page)
    expect(page.get_by_text("NPSN 20228801 sudah dipakai SD Cahaya Ilmu Depok")).to_be_visible()
    page.get_by_role("button", name="Simpan sekolah").click()
    expect(page).to_have_url(re.compile(r"/sekolah/baru"))


def test_kontrak_pertama_wajib(page: Page) -> None:
    page.goto(URL)
    isi_dasar(page, "20229915")
    page.get_by_role("button", name="Simpan sekolah").click()
    expect(page.get_by_text("Tanggal tanda tangan wajib diisi")).to_be_visible()
    expect(page.get_by_text("Nilai kontrak wajib diisi")).to_be_visible()
    expect(page).to_have_url(re.compile(r"/sekolah/baru"))


def test_berakhir_harus_setelah_mulai(page: Page) -> None:
    page.goto(URL)
    isi_dasar(page, "20229915")
    isi_kontrak(page, mulai="2027-01-01", berakhir="2026-12-01")
    page.get_by_role("button", name="Simpan sekolah").click()
    expect(page.get_by_text("Tanggal berakhir harus setelah tanggal mulai")).to_be_visible()


def test_simpan_sekolah_baru_muncul_di_halaman_dan_daftar(page: Page) -> None:
    page.goto(URL)
    isi_dasar(page, "20229915")
    isi_kontrak(page)
    page.get_by_role("button", name="Simpan sekolah").click()
    expect(page).to_have_url(re.compile(r"/sekolah/16"))
    expect(page.get_by_role("heading", name="SD Harapan Mulia Bogor")).to_be_visible()
    expect(page.get_by_test_id("contract-row")).to_have_count(1)
    page.get_by_role("link", name="Sekolah", exact=True).first.click()
    expect(page.get_by_text("16 sekolah klien")).to_be_visible()
