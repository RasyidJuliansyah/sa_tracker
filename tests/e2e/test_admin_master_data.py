"""Layar Admin – Master jenjang & paket (Figma 25:1013)."""
from playwright.sync_api import Page, expect

URL = "/master-data?as=admin"


def test_menampilkan_data_sesuai_desain(page: Page) -> None:
    page.goto(URL)
    jenjang = page.get_by_role("table", name="Tabel jenjang")
    paket = page.get_by_role("table", name="Tabel paket")
    expect(jenjang.get_by_role("row")).to_have_count(6)
    expect(paket.get_by_role("row")).to_have_count(5)
    expect(page.get_by_text("5 jenjang · 4 aktif")).to_be_visible()
    expect(page.get_by_text("4 paket · 3 aktif")).to_be_visible()


def test_tambah_paket_dengan_validasi(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Simpan").click()
    expect(page.get_by_text("Nama paket wajib diisi")).to_be_visible()
    page.get_by_placeholder("Contoh: Premium Plus").fill("standar")
    page.get_by_role("button", name="Simpan").click()
    expect(page.get_by_text("Nama paket sudah ada")).to_be_visible()
    page.get_by_placeholder("Contoh: Premium Plus").fill("Premium Plus")
    page.get_by_role("button", name="Simpan").click()
    expect(page.get_by_role("table", name="Tabel paket").get_by_role("row")).to_have_count(6)
    expect(page.get_by_text("5 paket · 4 aktif")).to_be_visible()


def test_tambah_jenjang_lewat_tombol_tambah(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Tambah jenjang").click()
    page.get_by_placeholder("Contoh: SMK Plus").fill("SLB")
    page.get_by_role("button", name="Simpan").first.click()
    expect(page.get_by_role("table", name="Tabel jenjang").get_by_role("row", name="SLB")).to_be_visible()


def test_nonaktifkan_dan_aktifkan_kembali(page: Page) -> None:
    page.goto(URL)
    baris = page.get_by_role("table", name="Tabel jenjang").get_by_role("row", name="SMK")
    page.get_by_label("Nonaktifkan jenjang SMK").click()
    expect(baris).to_contain_text("Nonaktif")
    expect(page.get_by_text("5 jenjang · 3 aktif")).to_be_visible()
    page.get_by_label("Aktifkan jenjang SMK").click()
    expect(baris).to_contain_text("Aktif")


def test_ubah_nama_paket(page: Page) -> None:
    page.goto(URL)
    page.get_by_label("Ubah paket Dasar").click()
    field = page.get_by_label("Nama paket", exact=True).first
    field.fill("Dasar Plus")
    field.press("Enter")
    expect(page.get_by_role("table", name="Tabel paket")).to_contain_text("Dasar Plus")
