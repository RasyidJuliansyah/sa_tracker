"""Rangka halaman per peran (Figma: Sidebar/Manager, Sidebar/Admin, App bar, HP/Top bar, HP/Nav bawah).

Peran dipilih lewat ?as=... yang hanya aktif saat dev, sampai login sungguhan ada.
"""
from playwright.sync_api import Page, expect


def test_manager_melihat_sidebar_manager(page: Page) -> None:
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto("/dashboard?as=manager")
    sidebar = page.get_by_label("Navigasi utama")
    expect(sidebar.get_by_text("Akun agent")).to_be_visible()
    expect(sidebar.get_by_text("Master data")).to_have_count(0)
    assert sidebar.bounding_box()["width"] == 220
    expect(sidebar.get_by_role("link", name="Dashboard")).to_have_attribute("aria-current", "page")
    expect(page.locator(".app-bar")).to_contain_text("Rina Nurhayati")
    assert page.locator(".app-bar").bounding_box()["height"] == 70


def test_admin_melihat_akun_dan_master_data(page: Page) -> None:
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto("/akun?as=admin")
    sidebar = page.get_by_label("Navigasi utama")
    expect(sidebar.get_by_role("link", name="Akun", exact=True)).to_have_attribute("aria-current", "page")
    expect(sidebar.get_by_text("Master data")).to_be_visible()
    expect(sidebar.get_by_text("Akun agent")).to_have_count(0)


def test_konten_dimulai_tepat_di_samping_sidebar(page: Page) -> None:
    page.set_viewport_size({"width": 1440, "height": 900})
    page.goto("/dashboard?as=manager")
    assert page.locator(".desktop-main__content").bounding_box()["x"] == 220


def test_agent_memakai_layout_hp_dengan_navigasi_bawah(page: Page) -> None:
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto("/agent?as=agent")
    nav = page.get_by_label("Navigasi utama")
    assert nav.bounding_box()["height"] == 64
    expect(nav.get_by_role("link", name="Beranda")).to_have_attribute("aria-current", "page")
    for label in ["Check-in", "Sekolah saya", "Riwayat"]:
        expect(nav.get_by_text(label)).to_be_visible()
    assert page.locator(".mobile-bar").bounding_box()["height"] == 56
    page.get_by_role("link", name="Riwayat").click()
    expect(page).to_have_url("http://localhost:3010/agent/riwayat")
