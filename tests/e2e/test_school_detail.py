"""Halaman sekolah (Figma 22:669, 22:933) dan dialog Catat perpanjangan (22:1417). Data tiruan di sisi klien."""
from playwright.sync_api import Page, expect

URL = "/sekolah/4?as=manager"


def test_ringkasan_menampilkan_data_figma(page: Page) -> None:
    page.goto(URL)
    expect(page.get_by_role("heading", name="SD Cahaya Ilmu Depok")).to_be_visible()
    expect(page.get_by_text("Berakhir 47 hari lagi")).to_be_visible()
    expect(page.get_by_text("Belum diperpanjang")).to_be_visible()
    expect(page.get_by_test_id("contract-row")).to_have_count(3)
    expect(page.get_by_text("111,1%")).to_be_visible()
    expect(page.get_by_text("Dimas Saputra").first).to_be_visible()


def test_tab_riwayat_perubahan(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("tab", name="Riwayat perubahan").click()
    expect(page.locator("tbody tr")).to_have_count(6)
    expect(page.get_by_text("1–6 dari 6")).to_be_visible()
    page.get_by_role("tab", name="Kunjungan").click()
    expect(page.locator("tbody tr")).to_have_count(3)


def test_perpanjangan_wajib_tanggal_tanda_tangan(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Catat perpanjangan").click()
    dialog = page.get_by_role("dialog")
    expect(dialog.get_by_text("Kontrak yang diperpanjang: Kontrak 2026")).to_be_visible()
    dialog.get_by_role("button", name="Simpan perpanjangan").click()
    expect(dialog.get_by_text("Tanggal tanda tangan wajib diisi")).to_be_visible()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)


def test_perpanjangan_tumpang_tindih_ditolak(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Catat perpanjangan").click()
    dialog = page.get_by_role("dialog")
    dialog.locator("#rn-signed-native").fill("2026-11-20")
    dialog.locator("#rn-start-native").fill("2026-12-01")
    dialog.get_by_role("button", name="Simpan perpanjangan").click()
    expect(dialog.get_by_text("Periode tumpang tindih dengan Kontrak 2026")).to_be_visible()
    dialog.locator("#rn-start-native").fill("2027-01-01")
    dialog.locator("#rn-end-native").fill("2026-12-31")
    dialog.get_by_role("button", name="Simpan perpanjangan").click()
    expect(dialog.get_by_text("Tanggal berakhir harus setelah tanggal mulai")).to_be_visible()


def test_perpanjangan_tersimpan_menambah_baris_riwayat(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Catat perpanjangan").click()
    dialog = page.get_by_role("dialog")
    dialog.locator("#rn-signed-native").fill("2026-11-20")
    dialog.locator("#rn-value").fill("66000000")
    expect(dialog.get_by_text("Retention Kontrak 2026: 110,0%")).to_be_visible()
    dialog.get_by_role("button", name="Simpan perpanjangan").click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(page.get_by_test_id("contract-row")).to_have_count(4)
    expect(page.get_by_test_id("contract-row").first).to_contain_text("Kontrak 2027")
    expect(page.get_by_text("Sudah diperpanjang").first).to_be_visible()
    page.get_by_role("button", name="Catat perpanjangan").click()
    expect(page.get_by_role("dialog").get_by_text("Kontrak yang diperpanjang: Kontrak 2027")).to_be_visible()
    page.keyboard.press("Escape")
    page.get_by_role("tab", name="Riwayat perubahan").click()
    expect(page.locator("tbody tr")).to_have_count(7)
