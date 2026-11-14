"""Layar Penugasan – Per agent (Figma 23:1126) dan dialog Pindahkan sekolah (23:1357). Data tiruan di sisi klien."""
from playwright.sync_api import Page, expect

URL = "/penugasan?as=manager"


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


def test_daftar_per_agent_dan_tanpa_agent(page: Page) -> None:
    page.goto(URL)
    expect(page.get_by_role("heading", name="Sekolah Dimas Saputra")).to_be_visible()
    expect(page.get_by_test_id("assignment-row")).to_have_count(4)
    expect(page.get_by_test_id("unassigned-row")).to_have_count(4)
    expect(page.get_by_test_id("unassigned-count")).to_have_text("4")
    page.get_by_role("button", name="Ayu Lestari").click()
    expect(page.get_by_role("heading", name="Sekolah Ayu Lestari")).to_be_visible()


def test_pindah_agent_mengubah_daftar(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Pindahkan SMP Gemilang Bogor").click()
    dialog = page.get_by_role("dialog")
    expect(dialog.get_by_text("Dari: Dimas Saputra")).to_be_visible()
    expect(dialog.get_by_text("Ditugaskan sejak 1 Okt 2025")).to_be_visible()
    dialog.get_by_role("button", name="Pindahkan", exact=True).click()
    expect(page.get_by_role("dialog")).to_have_count(0)
    expect(page.get_by_test_id("assignment-row")).to_have_count(3)
    expect(page.get_by_text("SMP Gemilang Bogor")).to_have_count(0)
    page.get_by_role("button", name="Ayu Lestari").click()
    expect(page.get_by_test_id("assignment-row")).to_have_count(5)
    expect(page.get_by_test_id("assignment-row").filter(has_text="SMP Gemilang Bogor")).to_have_count(1)


def test_pindah_tercatat_di_riwayat_sekolah(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Pindahkan SMP Gemilang Bogor").click()
    page.get_by_role("dialog").get_by_role("button", name="Pindahkan", exact=True).click()
    page.get_by_role("link", name="Sekolah", exact=True).first.click()
    page.get_by_text("SMP Gemilang Bogor").first.click()
    page.get_by_role("tab", name="Riwayat perubahan").click()
    expect(page.locator("tbody tr").first).to_contain_text("Penugasan")
    expect(page.locator("tbody tr").first).to_contain_text("Ayu Lestari")


def test_tugaskan_sekolah_tanpa_agent(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Tugaskan SMP Nusa Indah Bekasi").click()
    dialog = page.get_by_role("dialog")
    expect(dialog.get_by_text("Belum ada agent")).to_be_visible()
    dialog.get_by_role("button", name="Tugaskan", exact=True).click()
    expect(page.get_by_test_id("unassigned-row")).to_have_count(3)
    expect(page.get_by_test_id("unassigned-count")).to_have_text("3")


def test_tombol_tugaskan_sekolah_memilih_sekolah_dan_esc_menutup(page: Page) -> None:
    page.goto(URL)
    page.get_by_role("button", name="Tugaskan sekolah").click()
    dialog = page.get_by_role("dialog")
    dialog.get_by_role("button", name="Tugaskan", exact=True).click()
    expect(dialog.get_by_text("Sekolah wajib dipilih")).to_be_visible()
    pilih(page, "mv-school", "SMA Cendekia Ambon")
    dialog.get_by_role("button", name="Tugaskan", exact=True).click()
    expect(page.get_by_test_id("assignment-row")).to_have_count(5)
    page.get_by_role("button", name="Pindahkan SMA Cendekia Ambon").click()
    expect(page.get_by_role("dialog").get_by_text("Dari: Dimas Saputra")).to_be_visible()
    page.wait_for_timeout(500)  # tunggu animasi dialog selesai dan fokus pindah ke dialog
    page.keyboard.press("Escape")
    expect(page.get_by_role("dialog")).to_have_count(0)
