import pytest


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    # Lebar HP agent, sesuai pemakaian utama check-in
    return {**browser_context_args, "viewport": {"width": 1280, "height": 800}, "locale": "id-ID"}
