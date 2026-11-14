"""Layar Impor & ekspor CSV (Figma 23:596 dan 23:911). Data tiruan di sisi klien."""
from pathlib import Path

from playwright.sync_api import Page, expect

URL = "/impor-ekspor?as=manager"
CONTOH = Path(__file__).resolve().parents[2] / "frontend" / "public" / "templates" / "sekolah-november-2026.csv"


def unggah(page: Page) -> None:
    page.goto(URL)
    page.set_input_files("#import-file", str(CONTOH))


def test_pratinjau_impor_dari_file_csv(page: Page) -> None:
    unggah(page)
    expect(page.get_by_text("sekolah-november-2026.csv • 48 baris")).to_be_visible()
    expect(page.get_by_text("Diperbarui (NPSN sudah ada)")).to_be_visible()
    expect(page.get_by_role("button", name="Semua (48)")).to_be_visible()
    expect(page.get_by_role("button", name="Valid (45)")).to_be_visible()
    rows = page.get_by_test_id("import-row")
    expect(rows).to_have_count(3)  # filter awal: Gagal
    expect(page.get_by_text('Jenjang "SMU" tidak ada di master jenjang')).to_be_visible()
    expect(page.get_by_text("NPSN wajib diisi")).to_be_visible()
    expect(page.get_by_text("Tanggal berakhir harus setelah tanggal mulai")).to_be_visible()
    page.get_by_role("button", name="Valid (45)").click()
    expect(rows).to_have_count(10)
    expect(page.get_by_text("1–10 dari 45")).to_be_visible()
    page.get_by_role("button", name="Semua (48)").click()
    expect(page.get_by_text("1–10 dari 48")).to_be_visible()


def test_simpan_baris_valid_menambah_sekolah(page: Page) -> None:
    unggah(page)
    page.get_by_role("button", name="Simpan 45 baris valid").click()
    expect(page.get_by_text("Impor selesai")).to_be_visible()
    expect(page.get_by_text("12 sekolah baru ditambahkan")).to_be_visible()
    page.get_by_role("link", name="Lihat daftar sekolah").click()
    expect(page.get_by_text("27 sekolah klien")).to_be_visible()


def test_file_tanpa_kolom_wajib_ditolak(page: Page, tmp_path: Path) -> None:
    salah = tmp_path / "salah.csv"
    salah.write_text("a,b\n1,2\n", encoding="utf-8")
    page.goto(URL)
    page.set_input_files("#import-file", str(salah))
    expect(page.get_by_role("alert")).to_contain_text("Kolom wajib tidak ada")


def test_batal_kembali_ke_unggah(page: Page) -> None:
    unggah(page)
    page.get_by_role("button", name="Batal").click()
    expect(page.get_by_text("Unggah file CSV data sekolah")).to_be_visible()


def test_ekspor_dengan_filter_dan_tercatat(page: Page) -> None:
    page.goto(URL + "&tab=ekspor")
    expect(page.get_by_test_id("count-sekolah")).to_have_text("15 baris")
    option = page.get_by_role("option", name="SD", exact=True)
    for _ in range(3):
        page.locator("#ex-jenjang").click(force=True)
        try:
            option.wait_for(state="visible", timeout=1500)
            break
        except Exception:
            continue
    option.click()
    expect(page.get_by_test_id("count-sekolah")).to_have_text("4 baris")
    with page.expect_download() as dl:
        page.get_by_role("button", name="Unduh CSV").first.click()
    assert dl.value.suggested_filename == "data-sekolah.csv"
    isi = Path(dl.value.path()).read_bytes()
    assert isi.startswith(b"\xef\xbb\xbf")
    expect(page.get_by_test_id("export-log")).to_have_count(4)
    expect(page.get_by_test_id("export-log").first).to_contain_text("Jenjang SD")


def test_template_csv_dapat_diunduh(page: Page) -> None:
    page.goto(URL)
    with page.expect_download() as dl:
        page.get_by_role("link", name="Unduh template").click()
    assert dl.value.suggested_filename == "template-sekolah.csv"
