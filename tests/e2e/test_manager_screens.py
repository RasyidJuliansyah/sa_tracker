"""Layar Manager: Rekap kunjungan, Detail kunjungan, Akun agent (Figma 20:220, 20:576, 20:705, 20:912). Data tiruan."""
import re

from playwright.sync_api import Page, expect

REKAP = "/rekap?as=manager"
AKUN = "/akun-agent?as=manager"


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


def test_rekap_ringkasan_dan_paginasi(page: Page) -> None:
    page.goto(REKAP)
    expect(page.locator("tbody tr")).to_have_count(10)
    expect(page.get_by_text("44 kunjungan")).to_be_visible()
    expect(page.get_by_text("42 selesai")).to_be_visible()
    expect(page.get_by_text("2 berlangsung")).to_be_visible()
    expect(page.get_by_text("1–10 dari 44")).to_be_visible()
    page.get_by_role("button", name="Halaman berikutnya").click()
    expect(page.get_by_text("11–20 dari 44")).to_be_visible()


def test_rekap_jam_di_zona_agent_dan_tanggal_wib(page: Page) -> None:
    page.goto(REKAP)
    baris = page.locator("tbody tr")
    ayu = baris.filter(has_text="SMA Mutiara Makassar")
    expect(ayu).to_contain_text("10.05 WITA")
    expect(ayu).to_contain_text("14 Nov 2026")
    expect(ayu).to_contain_text("Sabtu")
    expect(baris.filter(has_text="SMP Cenderawasih Jayapura")).to_contain_text("13.20 WIT")
    expect(baris.filter(has_text="SMP Cenderawasih Jayapura")).to_contain_text("14.45 WIT")
    expect(baris.filter(has_text="SD Cahaya Ilmu Depok")).to_contain_text("09.00 WIB")


def test_rekap_filter_agent_sekolah_status(page: Page) -> None:
    page.goto(REKAP)
    pilih(page, "Agent", "Yohanes Wenda")
    expect(page.locator("tbody tr").first).to_contain_text("Yohanes Wenda")
    for teks in page.locator("tbody tr td:nth-child(3)").all_inner_texts():
        assert teks == "Yohanes Wenda"
    pilih(page, "Agent", "Semua agent")
    pilih(page, "Status", "Berlangsung")
    expect(page.locator("tbody tr")).to_have_count(2)
    pilih(page, "Sekolah", "SD Pelangi Sorong")
    expect(page.get_by_text("Kunjungan tidak ditemukan")).to_be_visible()


def test_rekap_filter_tanggal(page: Page) -> None:
    page.goto(REKAP)
    page.get_by_role("button", name="Pilih rentang tanggal").click()
    page.get_by_role("button", name="Semua tanggal").click()
    expect(page.locator("#f-tanggal")).to_contain_text("Semua tanggal")
    expect(page.get_by_text("44 kunjungan")).to_be_visible()


def test_klik_baris_membuka_detail_dengan_peta(page: Page) -> None:
    page.goto(REKAP)
    page.locator("tbody tr").filter(has_text="SD Cahaya Ilmu Depok").click()
    expect(page).to_have_url(re.compile(r"/rekap/2489"))
    expect(page.get_by_role("heading", name="SD Cahaya Ilmu Depok", level=2)).to_be_visible()
    expect(page.get_by_text("Bertemu Pak Hendra")).to_be_visible()
    expect(page.get_by_text("Ditulis saat check-out 10.15 WIB")).to_be_visible()
    maps = page.get_by_role("link", name="Buka di Google Maps")
    expect(maps).to_have_attribute("href", "https://www.google.com/maps?q=-6.4025,106.7942")
    expect(maps).to_have_attribute("target", "_blank")
    page.get_by_role("link", name="Rekap kunjungan").first.click()
    expect(page.get_by_text("44 kunjungan")).to_be_visible()


def test_detail_tidak_ditemukan(page: Page) -> None:
    page.goto("/rekap/99999?as=manager")
    expect(page.get_by_text("Kunjungan tidak ditemukan")).to_be_visible()


def test_akun_agent_tanpa_tombol_tambah(page: Page) -> None:
    page.goto(AKUN)
    expect(page.locator("tbody tr")).to_have_count(4)
    expect(page.get_by_role("button", name="Tambah akun")).to_have_count(0)
    expect(page.get_by_text("1–4 dari 4")).to_be_visible()


def test_akun_agent_cari_dan_filter(page: Page) -> None:
    page.goto(AKUN)
    page.locator("#f-cari").fill("ayu")
    expect(page.locator("tbody tr")).to_have_count(1)
    page.locator("#f-cari").fill("")
    pilih(page, "Status", "Nonaktif")
    expect(page.locator("tbody tr")).to_have_count(1)
    expect(page.locator("tbody tr")).to_contain_text("Bagus Pratama")


def test_ubah_akun_agent_validasi_dan_simpan(page: Page) -> None:
    page.goto(AKUN)
    page.get_by_role("button", name="Ubah akun Ayu Lestari").click()
    dialog = page.get_by_role("dialog", name="Ubah akun agent")
    expect(dialog.get_by_label("Email kantor")).to_have_attribute("readonly", "")
    dialog.get_by_label("Nama").fill("")
    dialog.get_by_role("button", name="Simpan perubahan").click()
    expect(dialog.get_by_text("Nama wajib diisi")).to_be_visible()
    dialog.get_by_label("Nama").fill("Ayu Lestari Putri")
    pilih(page, "Zona waktu", "WIT (Asia/Jayapura)")
    dialog.locator("#ag-active").click(force=True)
    dialog.get_by_role("button", name="Simpan perubahan").click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    baris = page.locator("tbody tr").filter(has_text="Ayu Lestari Putri")
    expect(baris).to_contain_text("WIT")
    expect(baris).to_contain_text("Nonaktif")


def test_dialog_ubah_tutup_dengan_esc(page: Page) -> None:
    page.goto(AKUN)
    page.get_by_role("button", name="Ubah akun Dimas Saputra").click()
    expect(page.get_by_role("dialog", name="Ubah akun agent")).to_be_visible()
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)
