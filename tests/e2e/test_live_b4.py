"""E2E terhadap backend sungguhan (B3-B4). Dilewati kecuali LIVE_E2E=1.

Jalankan: backend (CORS_ORIGIN = alamat frontend, database dev ber-seed), frontend TANPA dev:mock,
lalu `LIVE_E2E=1 .venv/bin/pytest tests/e2e/test_live_b4.py --base-url http://localhost:3012`.
Password seed semua akun: lihat backend/prisma/seed.ts.
"""
import os
import re
import time

import pytest
from playwright.sync_api import Page, expect

pytestmark = pytest.mark.skipif(os.environ.get("LIVE_E2E") != "1", reason="butuh backend sungguhan")
PW = os.environ.get("SEED_PASSWORD", "SkollaEdu")


def login(page: Page, email: str, password: str = PW) -> None:
    page.goto("/login")
    page.fill("#login-email", email)
    page.fill("#login-password", password)
    page.get_by_test_id("login-submit").click()
    expect(page).not_to_have_url(re.compile(r"/login$"), timeout=10000) if password == PW else None


def test_login_salah_menampilkan_galat(page: Page) -> None:
    login(page, "admin@skolla.education", "salah-salah")
    expect(page.get_by_test_id("login-alert")).to_be_visible()
    expect(page).to_have_url(re.compile(r"/login$"))


def test_tanpa_login_dialihkan_ke_login(page: Page) -> None:
    page.goto("/akun")
    expect(page).to_have_url(re.compile(r"/login$"))


def test_admin_login_lalu_kelola_akun(page: Page) -> None:
    login(page, "admin@skolla.education")
    expect(page).to_have_url(re.compile(r"/akun$"))
    expect(page.get_by_text("Admin Skolla").first).to_be_visible()
    email = f"uji{int(time.time())}@skolla.education"
    page.get_by_role("button", name="Tambah akun").click()
    page.fill("#acc-name", "Akun Uji Live")
    page.fill("#acc-email", email)
    page.get_by_role("button", name="Buat akun").click()
    page.fill("#f-cari", email)  # daftar bertambah tiap uji; cari agar tidak terdorong ke halaman lain
    expect(page.get_by_text(email)).to_be_visible()


def test_admin_master_data_dan_audit_log(page: Page) -> None:
    login(page, "admin@skolla.education")
    page.goto("/master-data")
    expect(page.get_by_text("SMP", exact=True).first).to_be_visible()
    page.goto("/audit-log")
    expect(page.get_by_text("Login").first).to_be_visible()


def test_manager_akun_agent_dan_pembatasan_rute(page: Page) -> None:
    login(page, "manager@skolla.education")
    expect(page).to_have_url(re.compile(r"/dashboard$"))
    page.goto("/akun-agent")
    expect(page.get_by_text("Citra Agent")).to_be_visible()
    page.goto("/akun")  # khusus admin
    expect(page).to_have_url(re.compile(r"/dashboard$"))


def test_agent_dialihkan_ke_beranda_agent(page: Page) -> None:
    login(page, "citra@skolla.education")
    expect(page).to_have_url(re.compile(r"/agent$"))
    page.goto("/audit-log")
    expect(page).to_have_url(re.compile(r"/agent$"))


# ---- B5/B6: sekolah, penugasan, target (data seed: Sekolah A dan B) ----
def test_manager_daftar_dan_halaman_sekolah(page: Page) -> None:
    login(page, "manager@skolla.education")
    page.goto("/sekolah")
    expect(page.get_by_text("SMA Sekolah A")).to_be_visible()
    expect(page.get_by_text("SMP Sekolah B")).to_be_visible()
    page.get_by_text("SMA Sekolah A").click()
    expect(page).to_have_url(re.compile(r"/sekolah/\d+$"))
    expect(page.get_by_text("10000001").first).to_be_visible()


def test_manager_penugasan_dan_target(page: Page) -> None:
    login(page, "manager@skolla.education")
    page.goto("/penugasan")
    expect(page.get_by_text("Citra Agent").first).to_be_visible()
    page.goto("/target-retention")
    expect(page.get_by_test_id("target-row").first).to_be_visible()


def test_agent_tidak_melihat_sekolah_lain_lewat_api(page: Page) -> None:
    login(page, "citra@skolla.education")
    # Sekolah A (id 1) milik Citra; Sekolah B (id 2) milik agent lain.
    api = os.environ.get("LIVE_API", "http://localhost:3013/api")
    assert page.request.get(f"{api}/schools/1").status == 200
    assert page.request.get(f"{api}/schools/2").status == 404


# ---- B7: check-in/check-out dengan foto, lalu manager melihat di Rekap ----
PNG_1PX = bytes.fromhex(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000" "1f15c4890000000d49444154789c6360f8cfc0f01f0005000201a5f645400000000049454e44ae426082"
)


def test_agent_check_in_check_out_dan_manager_melihat_rekap(browser, base_url: str) -> None:
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844}, locale="id-ID", base_url=base_url,
        permissions=["geolocation"], geolocation={"latitude": -6.23841, "longitude": 106.99312, "accuracy": 12},
    )
    page = ctx.new_page()
    login(page, "citra@skolla.education")
    expect(page).to_have_url(re.compile(r"/agent$"))
    # Bersihkan kunjungan berlangsung sisa (bila ada) agar tes bisa diulang.
    if page.get_by_role("button", name="Check-out dan tulis laporan").count():
        page.get_by_role("button", name="Check-out dan tulis laporan").click()
        page.get_by_label("Laporan kunjungan").fill("Sisa kunjungan uji.")
        page.get_by_role("button", name="Check-out", exact=True).click()
        expect(page.get_by_role("heading", name="Kunjungan selesai", level=2)).to_be_visible()
        page.get_by_role("link", name="Kembali ke beranda").click()
    page.get_by_label("Navigasi utama").get_by_role("link", name="Check-in").click()
    page.get_by_role("button", name="Lanjut ke foto").click()
    page.set_input_files("[data-testid=foto-input]", {"name": "k.png", "mimeType": "image/png", "buffer": PNG_1PX})
    page.get_by_role("button", name="Check-in sekarang").click()
    expect(page).to_have_url(re.compile(r"/agent$"))
    expect(page.get_by_label("Kunjungan berlangsung")).to_be_visible()
    laporan = f"Laporan uji live {int(time.time())}"
    page.get_by_role("button", name="Check-out dan tulis laporan").click()
    page.get_by_label("Laporan kunjungan").fill(laporan)
    page.get_by_role("button", name="Check-out", exact=True).click()
    expect(page.get_by_role("heading", name="Kunjungan selesai", level=2)).to_be_visible()
    ctx.close()

    mgr = browser.new_context(viewport={"width": 1280, "height": 800}, locale="id-ID", base_url=base_url)
    mp = mgr.new_page()
    login(mp, "manager@skolla.education")
    mp.goto("/rekap")
    expect(mp.get_by_text("Citra Agent").first).to_be_visible()
    mp.get_by_text("Citra Agent").first.click()
    expect(mp).to_have_url(re.compile(r"/rekap/\d+$"))
    expect(mp.get_by_text(laporan)).to_be_visible()
    expect(mp.get_by_alt_text("Foto bukti kunjungan")).to_be_visible()
    mgr.close()


# ---- B8: dashboard dari API ----
def test_dashboard_manager_memuat_data_nyata(page: Page) -> None:
    login(page, "manager@skolla.education")
    expect(page).to_have_url(re.compile(r"/dashboard$"))
    expect(page.locator(".stat-card__label", has_text="Perpanjangan ditandatangani")).to_be_visible()
    expect(page.get_by_text("Citra Agent").first).to_be_visible()
    page.get_by_role("tab", name="Hari").click()
    expect(page.locator(".stat-card__label", has_text="Kunjungan selesai")).to_be_visible()


def test_beranda_agent_memuat_data_nyata(page: Page) -> None:
    login(page, "citra@skolla.education")
    expect(page.get_by_role("heading", name="Halo, Citra")).to_be_visible()
    expect(page.get_by_text("Kontrak perlu perhatian")).to_be_visible()


# ---- B9: impor dan ekspor CSV lewat server ----
def test_impor_csv_pratinjau_lalu_simpan_dan_ekspor(page: Page, tmp_path) -> None:
    import random

    login(page, "manager@skolla.education")
    npsn = str(random.randint(10000000, 99999999))
    csv = (
        "npsn,nama_sekolah,jenjang,paket,zona_waktu,kota,alamat,pic,kontak_pic,id_lms,tanggal_ttd,tanggal_mulai,tanggal_berakhir,nilai_kontrak\n"
        f"{npsn},SMP Impor Live,SMP,Skolla Basic,WIB,Bogor,Jl X,Ibu Y,0812,,2026-01-01,2026-02-01,2027-01-31,25000000\n"
        "12345678,Jenjang Salah,SMU,Skolla Basic,,,,,,,,,,\n"
    )
    f = tmp_path / "impor.csv"
    f.write_text(csv, encoding="utf-8")
    page.goto("/impor-ekspor")
    page.set_input_files("#import-file", str(f))
    expect(page.get_by_role("button", name="Semua (2)")).to_be_visible()
    expect(page.get_by_role("button", name="Gagal (1)")).to_be_visible()
    expect(page.get_by_text('Jenjang "SMU" tidak ada di master jenjang')).to_be_visible()
    page.get_by_role("button", name="Simpan 1 baris valid").click()
    expect(page.get_by_text("Impor selesai")).to_be_visible()
    page.goto("/impor-ekspor?tab=ekspor")
    with page.expect_download() as dl:
        page.get_by_role("button", name="Unduh CSV").first.click()
    assert npsn in open(dl.value.path(), encoding="utf-8-sig").read()
    expect(page.get_by_test_id("export-log").first).to_contain_text("Data sekolah")


def test_keluar_menghapus_sesi(page: Page) -> None:
    login(page, "manager@skolla.education")
    expect(page).to_have_url(re.compile(r"/dashboard$"))
    page.get_by_test_id("menu-akun").click()
    page.get_by_test_id("keluar").click()
    expect(page).to_have_url(re.compile(r"/login$"))
    page.goto("/dashboard")
    expect(page).to_have_url(re.compile(r"/login$"))  # cookie sudah dihapus
