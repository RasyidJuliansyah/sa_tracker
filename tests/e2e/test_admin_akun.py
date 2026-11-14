"""Layar Admin – Akun (Figma 25:2, 25:338, 25:692). Data tiruan di sisi klien."""
from playwright.sync_api import Page, expect

URL = "/akun?as=admin"


def pilih(page: Page, nama_field: str, opsi: str) -> None:
    page.get_by_role("combobox", name=nama_field).click(force=True)
    page.get_by_role("option", name=opsi, exact=True).click()


def test_tabel_menampilkan_tujuh_akun(page: Page) -> None:
    page.goto(URL)
    expect(page.locator("tbody tr")).to_have_count(7)
    expect(page.get_by_text("1–7 dari 7")).to_be_visible()


def test_pencarian_dan_filter(page: Page) -> None:
    page.goto(URL)
    page.locator("#f-cari").fill("ayu")
    expect(page.locator("tbody tr")).to_have_count(1)
    page.locator("#f-cari").fill("")
    pilih(page, "Peran", "Manager")
    expect(page.locator("tbody tr")).to_have_count(2)
    pilih(page, "Status", "Wajib ganti password")
    expect(page.locator("tbody tr")).to_have_count(1)
    pilih(page, "Status", "Nonaktif")
    expect(page.get_by_text("Akun tidak ditemukan")).to_be_visible()


def test_tambah_akun_valid_muncul_di_tabel(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Tambah akun").click()
    dialog = page.get_by_role("dialog", name="Tambah akun")
    dialog.get_by_role("button", name="Buat akun").click()
    expect(dialog.get_by_text("Nama wajib diisi")).to_be_visible()
    expect(dialog.get_by_text("Email kantor wajib diisi")).to_be_visible()
    dialog.get_by_label("Nama *").fill("Budi Santoso")
    dialog.get_by_label("Email kantor *").fill("budi@")
    dialog.get_by_role("button", name="Buat akun").click()
    expect(dialog.get_by_text("Format email tidak valid")).to_be_visible()
    dialog.get_by_label("Email kantor *").fill("budi.santoso@skolla.id")
    dialog.get_by_role("button", name="Buat akun").click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(page.locator("tbody tr")).to_have_count(8)
    baris = page.locator("tbody tr", has_text="Budi Santoso")
    expect(baris).to_contain_text("Wajib ganti password")


def test_email_duplikat_ditolak(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Tambah akun").click()
    dialog = page.get_by_role("dialog", name="Tambah akun")
    dialog.get_by_label("Nama *").fill("Ayu Baru")
    dialog.get_by_label("Email kantor *").fill("ayu.lestari@skolla.id")
    dialog.get_by_role("button", name="Buat akun").click()
    expect(dialog.get_by_text("Email sudah terdaftar")).to_be_visible()


def test_esc_menutup_dialog(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Tambah akun").click()
    expect(page.get_by_role("dialog")).to_be_visible()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)


def test_nonaktifkan_mengubah_chip_status(page: Page) -> None:
    page.goto(URL)
    page.get_by_label("Ubah akun Yohanes Wenda").click()
    page.get_by_role("button", name="Nonaktifkan akun").click()
    expect(page.locator("tbody tr", has_text="Yohanes Wenda")).to_contain_text("Nonaktif")
    page.get_by_label("Ubah akun Yohanes Wenda").click()
    page.get_by_role("button", name="Aktifkan akun").click()
    expect(page.locator("tbody tr", has_text="Yohanes Wenda")).to_contain_text("Aktif")


def test_reset_password_menampilkan_password_sementara(page: Page) -> None:
    page.goto(URL)
    page.get_by_label("Reset password Ayu Lestari").click()
    dialog = page.get_by_role("dialog", name="Reset password")
    expect(dialog).to_contain_text("Ayu Lestari • ayu.lestari@skolla.id")
    temp = dialog.get_by_test_id("temp-password")
    expect(temp).to_be_visible()
    assert len(temp.inner_text().split("\n")[0].strip()) == 8
    dialog.get_by_role("button", name="Reset password").click()
    expect(dialog.get_by_role("button", name="Tutup", exact=True).first).to_be_visible()
    dialog.get_by_role("button", name="Tutup", exact=True).first.click()
    expect(page.locator("tbody tr", has_text="Ayu Lestari")).to_contain_text("Wajib ganti password")
