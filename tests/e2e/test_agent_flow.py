"""Alur agent di HP (Figma: 02 Agent (HP)), dengan data tiruan di klien.

State kunjungan hidup di memori halaman, jadi tiap tes mulai dari /agent?as=agent lalu berpindah lewat
tautan di dalam aplikasi (bukan page.goto) supaya state tidak ter-reset.
"""
import re

import pytest
from playwright.sync_api import Browser, Page, expect

# PNG 1x1 untuk foto uji
PNG = bytes.fromhex(
    "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489"
    "0000000d49444154789c6360f8cfc0f01f0005000201a5f645400000000049454e44ae426082"
)
FOTO = {"name": "kunjungan.png", "mimeType": "image/png", "buffer": PNG}
LAPORAN = "Bertemu wakasek kurikulum. Pelatihan ulang disepakati 21 Nov."


def _context(browser: Browser, *, geo: bool):
    kwargs = {"viewport": {"width": 390, "height": 844}, "locale": "id-ID", "base_url": "http://localhost:3022"}
    if geo:
        kwargs.update(permissions=["geolocation"], geolocation={"latitude": -6.23841, "longitude": 106.99312, "accuracy": 12})
    return browser.new_context(**kwargs)


@pytest.fixture
def hp(browser: Browser, base_url: str):
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844}, locale="id-ID", base_url=base_url,
        permissions=["geolocation"], geolocation={"latitude": -6.23841, "longitude": 106.99312, "accuracy": 12},
    )
    page = ctx.new_page()
    page.goto("/agent?as=agent")
    yield page
    ctx.close()


@pytest.fixture
def hp_tanpa_izin(browser: Browser, base_url: str):
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, locale="id-ID", base_url=base_url)
    page = ctx.new_page()
    page.goto("/agent?as=agent")
    yield page
    ctx.close()


def selesaikan_kunjungan_berjalan(page: Page) -> None:
    page.get_by_role("button", name="Check-out dan tulis laporan").click()
    page.get_by_label("Laporan kunjungan").fill(LAPORAN)
    page.get_by_role("button", name="Check-out", exact=True).click()
    expect(page.get_by_role("heading", name="Kunjungan selesai", level=2)).to_be_visible()
    page.get_by_role("link", name="Kembali ke beranda").click()


def buka_check_in(page: Page) -> None:
    page.get_by_label("Navigasi utama").get_by_role("link", name="Check-in").click()


def test_beranda_menampilkan_kunjungan_berlangsung(hp: Page) -> None:
    expect(hp.get_by_role("heading", name="Halo, Dimas")).to_be_visible()
    expect(hp.get_by_label("Kunjungan berlangsung")).to_contain_text("SMA Bina Insani Bekasi")
    expect(hp.get_by_label("Kunjungan berlangsung")).to_contain_text("Check-in 09.15 WIB")
    expect(hp.get_by_label("Kunjungan berlangsung")).to_contain_text("berjalan 1 j 25 m")


def test_check_in_diblokir_selama_ada_kunjungan_berlangsung(hp: Page) -> None:
    buka_check_in(hp)
    expect(hp.get_by_role("alert")).to_contain_text("masih punya kunjungan yang berlangsung")
    expect(hp.get_by_role("button", name="Lanjut ke foto")).to_have_count(0)


def test_sekolah_ditugaskan_tampil_paling_atas(hp: Page) -> None:
    selesaikan_kunjungan_berjalan(hp)
    buka_check_in(hp)
    expect(hp.get_by_role("radiogroup")).to_be_visible()
    judul = hp.locator("h2").all_inner_texts()
    assert judul.index("Ditugaskan kepada Anda") < judul.index("Sekolah lain")
    opsi = hp.get_by_role("radio").all()
    nama = [o.locator(".option__name").inner_text() for o in opsi]
    assert nama[:4] == ["SMA Bina Insani Bekasi", "SMP Gemilang Bogor", "SD Cahaya Ilmu Depok", "SMK Taruna Jaya Karawang"]
    assert nama[4:] == ["SMP Nusa Indah Bekasi", "SMA Lentera Jakarta Timur"]
    # Sekolah tidak ditugaskan tetap bisa dipilih
    hp.get_by_role("radio", name="SMA Lentera Jakarta Timur").click()
    expect(hp.get_by_role("radio", name="SMA Lentera Jakarta Timur")).to_have_attribute("aria-checked", "true")


def test_pencarian_sekolah_lewat_npsn(hp: Page) -> None:
    selesaikan_kunjungan_berjalan(hp)
    buka_check_in(hp)
    hp.get_by_label("Cari sekolah").fill("20231456")
    expect(hp.get_by_role("radio")).to_have_count(1)
    expect(hp.get_by_role("radio")).to_contain_text("SMP Gemilang Bogor")


def test_check_in_tanpa_foto_ditolak(hp: Page) -> None:
    selesaikan_kunjungan_berjalan(hp)
    buka_check_in(hp)
    hp.get_by_role("button", name="Lanjut ke foto").click()
    expect(hp.get_by_text("Akurasi ±12 m")).to_be_visible()
    hp.get_by_role("button", name="Check-in sekarang").click()
    expect(hp.get_by_role("alert")).to_have_text("Check-in ditolak: foto belum diambil.")
    expect(hp).to_have_url(re.compile(r"/agent/check-in$"))


def test_izin_lokasi_ditolak_menampilkan_pesan(hp_tanpa_izin: Page) -> None:
    page = hp_tanpa_izin
    selesaikan_kunjungan_berjalan(page)
    buka_check_in(page)
    page.get_by_role("button", name="Lanjut ke foto").click()
    expect(page.get_by_text("Izin lokasi ditolak")).to_be_visible()
    expect(page.get_by_role("alert")).to_have_text("Check-in ditolak: foto belum diambil dan izin lokasi belum diberikan.")
    expect(page.get_by_role("button", name="Coba lagi")).to_be_visible()
    # Foto saja tidak cukup tanpa lokasi: tombol tetap "Coba lagi", tidak ada kunjungan baru
    page.set_input_files("[data-testid=foto-input]", FOTO)
    page.get_by_role("button", name="Coba lagi").click()
    expect(page.get_by_text("Izin lokasi ditolak")).to_be_visible()
    expect(page.get_by_role("button", name="Check-in sekarang")).to_have_count(0)


def test_check_in_berhasil_membuat_kunjungan_berlangsung_di_beranda(hp: Page) -> None:
    selesaikan_kunjungan_berjalan(hp)
    buka_check_in(hp)
    hp.get_by_role("radio", name="SMP Gemilang Bogor").click()
    hp.get_by_role("button", name="Lanjut ke foto").click()
    expect(hp.get_by_text("Akurasi ±12 m")).to_be_visible()
    hp.set_input_files("[data-testid=foto-input]", FOTO)
    expect(hp.get_by_alt_text("Pratinjau foto bukti kunjungan")).to_be_visible()
    hp.get_by_role("button", name="Check-in sekarang").click()
    expect(hp).to_have_url(re.compile(r"/agent$"))
    panel = hp.get_by_label("Kunjungan berlangsung")
    expect(panel).to_contain_text("SMP Gemilang Bogor")
    expect(panel).to_contain_text("WIB")
    # Satu agent hanya satu kunjungan berlangsung: check-in kedua diblokir
    buka_check_in(hp)
    expect(hp.get_by_role("alert")).to_contain_text("masih punya kunjungan yang berlangsung")


def test_input_foto_memakai_kamera_belakang(hp: Page) -> None:
    selesaikan_kunjungan_berjalan(hp)
    buka_check_in(hp)
    hp.get_by_role("button", name="Lanjut ke foto").click()
    foto = hp.locator("[data-testid=foto-input]")
    expect(foto).to_have_attribute("accept", "image/*")
    expect(foto).to_have_attribute("capture", "environment")


def test_check_out_tanpa_laporan_ditolak(hp: Page) -> None:
    hp.get_by_role("button", name="Check-out dan tulis laporan").click()
    hp.get_by_role("button", name="Check-out", exact=True).click()
    expect(hp.get_by_text("Check-out ditolak: laporan kunjungan wajib diisi.")).to_be_visible()
    expect(hp).to_have_url(re.compile(r"/agent/check-out$"))
    # Spasi saja juga ditolak
    hp.get_by_label("Laporan kunjungan").fill("   ")
    hp.get_by_role("button", name="Check-out", exact=True).click()
    expect(hp.get_by_text("Check-out ditolak: laporan kunjungan wajib diisi.")).to_be_visible()


def test_check_out_berhasil(hp: Page) -> None:
    hp.get_by_role("button", name="Check-out dan tulis laporan").click()
    expect(hp.get_by_text("Durasi berjalan")).to_be_visible()
    hp.get_by_label("Laporan kunjungan").fill(LAPORAN)
    hp.get_by_role("button", name="Check-out", exact=True).click()
    expect(hp.get_by_role("heading", name="Kunjungan selesai", level=2)).to_be_visible()
    expect(hp.get_by_text("Laporan sudah tersimpan dan bisa dilihat manager.")).to_be_visible()
    expect(hp.get_by_text("SMA Bina Insani Bekasi")).to_be_visible()
    hp.get_by_role("link", name="Kembali ke beranda").click()
    expect(hp.get_by_label("Kunjungan berlangsung")).to_have_count(0)
    expect(hp.get_by_text("Belum ada kunjungan berlangsung")).to_be_visible()
    # Riwayat memuat kunjungan yang baru selesai, terbaru di atas
    hp.get_by_label("Navigasi utama").get_by_role("link", name="Riwayat").click()
    pertama = hp.locator(".row").first
    expect(pertama).to_contain_text("SMA Bina Insani Bekasi")
    expect(pertama).to_contain_text("Selesai")


def test_sekolah_saya_dan_detail_menampilkan_kontrak_hanya_untuk_sekolah_ditugaskan(hp: Page) -> None:
    hp.get_by_label("Navigasi utama").get_by_role("link", name="Sekolah saya").click()
    expect(hp.get_by_text("4 sekolah ditugaskan kepada Anda")).to_be_visible()
    hp.get_by_role("link", name="SMA Bina Insani Bekasi").click()
    expect(hp.get_by_text("Rp 80.000.000").first).to_be_visible()
    expect(hp.get_by_text("Retention 111,1%")).to_be_visible()


def test_detail_sekolah_tidak_ditugaskan_menyembunyikan_nilai_kontrak(hp: Page) -> None:
    hp.get_by_label("Navigasi utama").get_by_role("link", name="Riwayat").click()
    hp.get_by_role("link", name="SMP Nusa Indah Bekasi").click()
    expect(hp.get_by_text("Nilai kontrak dan retention hanya tampil untuk sekolah yang ditugaskan kepada Anda.")).to_be_visible()
    expect(hp.get_by_text("Rp ")).to_have_count(0)
    expect(hp.get_by_text("Nilai kontrak", exact=True)).to_have_count(0)
