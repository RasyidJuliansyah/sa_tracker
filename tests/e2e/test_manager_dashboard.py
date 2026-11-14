"""Dashboard manager (Figma: Manager – Dashboard). Data tiruan, hari ini = Sabtu 14 Nov 2026."""
from playwright.sync_api import Page, expect


def buka(page: Page) -> None:
    page.set_viewport_size({"width": 1440, "height": 1024})
    page.goto("/dashboard?as=manager")
    expect(page.get_by_test_id("period-label")).to_be_visible()


def test_periode_awal_minggu_senin_sampai_minggu(page: Page) -> None:
    buka(page)
    expect(page.get_by_test_id("period-label")).to_have_text("9–15 November 2026")
    expect(page.get_by_text("dibandingkan dengan minggu sebelumnya (2–8 November 2026)")).to_be_visible()


def test_geser_dan_ganti_periode_dalam_wib(page: Page) -> None:
    buka(page)
    page.get_by_role("button", name="Periode sebelumnya").click()
    expect(page.get_by_test_id("period-label")).to_have_text("2–8 November 2026")
    page.get_by_role("tab", name="Bulan").click()
    expect(page.get_by_test_id("period-label")).to_have_text("November 2026")  # geser dibatalkan saat ganti jenis periode
    expect(page.get_by_text("Total durasi").locator("xpath=..").get_by_text("231 j 10 m")).to_be_visible()
    page.get_by_role("tab", name="Hari").click()
    expect(page.get_by_test_id("period-label")).to_have_text("Sabtu, 14 November 2026")


def test_retention_tahunan_tidak_ikut_periode(page: Page) -> None:
    buka(page)
    kartu = page.locator(".ret")
    expect(kartu).to_contain_text("59,8%")
    expect(kartu).to_contain_text("Sesuai target")
    page.get_by_role("tab", name="Bulan").click()
    expect(kartu).to_contain_text("59,8%")


def test_peringkat_status_dari_kontrak_diputuskan_bukan_persen(page: Page) -> None:
    buka(page)
    kartu = page.get_by_test_id("rank-5")  # Ayu 62,7% tetapi Sesuai target
    expect(kartu).to_contain_text("62,7%")
    expect(kartu).to_contain_text("Sesuai target")
    expect(page.get_by_test_id("rank-6")).to_contain_text("Di bawah target")


def test_filter_agent_memengaruhi_peringkat_dan_tabel(page: Page) -> None:
    buka(page)
    expect(page.get_by_test_id("agent-filter")).to_contain_text("Semua agent (3)")
    page.get_by_test_id("agent-filter").click()
    menu = page.locator(".v-overlay-container .v-list")
    menu.get_by_text("Yohanes Wenda", exact=True).click()  # dari "semua" menjadi hanya Yohanes
    page.keyboard.press("Escape")
    expect(page.get_by_test_id("agent-filter")).to_contain_text("Yohanes Wenda")
    expect(page.locator("[data-testid^='rank-']")).to_have_count(1)
    expect(page.get_by_test_id("rank-6")).to_be_visible()
    tabel = page.get_by_test_id("period-visits")
    expect(tabel).not_to_contain_text("Dimas Saputra")
    expect(tabel).not_to_contain_text("Ayu Lestari")
    # kembali ke semua agent
    page.get_by_test_id("agent-filter").click()
    page.locator(".v-overlay-container .v-list").get_by_text("Semua agent", exact=True).click()
    page.keyboard.press("Escape")
    expect(page.locator("[data-testid^='rank-']")).to_have_count(3)


def test_tab_grafik_berganti(page: Page) -> None:
    buka(page)
    expect(page.get_by_role("heading", name="Kunjungan per hari")).to_be_visible()
    expect(page.get_by_text("Minggu ini: 42")).to_be_visible()
    page.get_by_role("tab", name="Perpanjangan").click()
    expect(page.get_by_role("heading", name="Perpanjangan per hari")).to_be_visible()
    expect(page.get_by_text("Minggu ini: Rp 120 jt")).to_be_visible()
    page.get_by_role("tab", name="Durasi").click()
    expect(page.get_by_text("Minggu ini: 58 j 20 m")).to_be_visible()


def test_rincian_agent_membuka_dialog_dan_esc_menutup(page: Page) -> None:
    buka(page)
    page.get_by_role("button", name="Rincian Dimas Saputra").click()
    dialog = page.get_by_role("dialog")
    expect(dialog).to_contain_text("Dimas Saputra")
    expect(dialog).to_contain_text("Rp 248 jt")
    page.wait_for_timeout(400)  # tunggu animasi dialog selesai sebelum Esc
    page.keyboard.press("Escape")
    expect(dialog).to_be_hidden()


def test_tabel_kunjungan_jam_di_zona_agent_dan_pagination(page: Page) -> None:
    buka(page)
    tabel = page.get_by_test_id("period-visits")
    expect(tabel).to_contain_text("09.15 WIB")
    expect(tabel).to_contain_text("10.05 WITA")
    expect(tabel).to_contain_text("13.20 WIT")
    footer = page.locator(".vis .table-footer")
    expect(footer).to_contain_text("1–10 dari")
    page.get_by_role("link", name="Buka rekap kunjungan").click()
    expect(page).to_have_url("http://localhost:3010/rekap")
