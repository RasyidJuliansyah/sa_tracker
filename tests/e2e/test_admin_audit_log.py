"""Layar Audit log (Figma 25:1265). Dipakai admin dan manager."""
from playwright.sync_api import Page, expect


def pilih(page: Page, nama_field: str, opsi: str) -> None:
    combo = page.get_by_role("combobox", name=nama_field)
    option = page.get_by_role("option", name=opsi, exact=True)
    for _ in range(3):  # klik pertama kadang hanya menutup menu sebelumnya
        page.evaluate("window.scrollTo(0, 0)")  # filter tidak boleh tertutup app bar
        combo.click(force=True)
        try:
            option.wait_for(state="visible", timeout=1500)
            break
        except Exception:
            continue
    option.click()
    expect(page.get_by_role("listbox")).to_have_count(0)


def test_tampil_sesuai_desain(page: Page) -> None:
    page.goto("/audit-log?as=admin")
    expect(page.get_by_test_id("audit-row")).to_have_count(10)
    expect(page.get_by_text("1–10 dari 312")).to_be_visible()
    # Baris Pindah terpilih dan rinciannya tampil
    panel = page.get_by_role("region", name="Rincian perubahan")
    expect(panel).to_contain_text("Rina Nurhayati (Manager)")
    expect(panel).to_contain_text("school_assignments #88, #131")
    expect(panel).to_contain_text("Ayu Lestari")


def test_bisa_dibuka_manager(page: Page) -> None:
    page.goto("/audit-log?as=manager")
    expect(page.get_by_test_id("audit-row").first).to_be_visible()


def test_klik_baris_mengganti_rincian(page: Page) -> None:
    page.goto("/audit-log?as=admin")
    page.get_by_test_id("audit-row").first.click()
    panel = page.get_by_role("region", name="Rincian perubahan")
    expect(panel).to_contain_text("Dimas Saputra (Agent)")
    expect(panel).to_contain_text("Check-out")
    expect(panel).to_contain_text("Tidak ada perubahan kolom")


def test_filter_jenis_data_dan_pelaku(page: Page) -> None:
    page.goto("/audit-log?as=admin")
    pilih(page, "Jenis data", "Akun")
    rows = page.get_by_test_id("audit-row")
    expect(rows.first).to_contain_text("Akun")
    expect(page.get_by_text("dari 312")).to_have_count(0)
    pilih(page, "Pelaku", "Fajar Hidayat")
    for i in range(rows.count()):
        expect(rows.nth(i)).to_contain_text("Fajar Hidayat")
    pilih(page, "Aksi", "Nonaktifkan")
    expect(rows).to_have_count(1)
    expect(rows.first).to_contain_text("Bagus Pratama")


def test_filter_tanpa_hasil_menampilkan_keadaan_kosong(page: Page) -> None:
    page.goto("/audit-log?as=admin")
    pilih(page, "Pelaku", "Yohanes Wenda")
    pilih(page, "Jenis data", "Kontrak")
    expect(page.get_by_text("Tidak ada catatan")).to_be_visible()


def test_filter_tanggal_dan_paginasi(page: Page) -> None:
    page.goto("/audit-log?as=admin")
    page.get_by_label("Halaman berikutnya").click()
    expect(page.get_by_text("11–20 dari 312")).to_be_visible()
    page.get_by_label("Pilih rentang tanggal").click()
    page.get_by_role("button", name="Semua tanggal").click()
    expect(page.get_by_label("Pilih rentang tanggal")).to_contain_text("Semua tanggal")
    expect(page.get_by_text("1–10 dari 312")).to_be_visible()


def test_ubah_baris_per_halaman(page: Page) -> None:
    page.goto("/audit-log?as=admin")
    page.get_by_label("Baris per halaman").click()
    page.locator(".v-list-item", has_text="25").click()
    expect(page.get_by_test_id("audit-row")).to_have_count(25)
