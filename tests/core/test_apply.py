"""Unit tests for the Commands module."""
import pytest

import fideslang as models
from fidesctl.core.apply import sort_create_update


# Helpers
@pytest.fixture()
def server_resource_list():
    yield [
        {"fides_key": "testKey", "id": 1, "name": "Some resource"},
        {"fides_key": "anotherTestKey", "id": 2, "name": "Another resource"},
    ]


@pytest.fixture()
def server_resource_key_pairs():
    yield {"testKey": 1, "anotherTestKey": 2}


# Unit
@pytest.mark.unit
def test_sort_create_update_create():
    resource_1 = models.DataCategory(
        organization_fides_key=1,
        fides_key="some_resource",
        name="Test resource 1",
        description="Test Description",
    )
    resource_2 = models.DataCategory(
        organization_fides_key=1,
        fides_key="another_system",
        name="Test System 2",
        description="Test Description",
    )
    expected_create_result = [resource_2]
    manifest_resource_list = [resource_2]
    server_resource_list = [resource_1]

    (
        create_result,
        update_result,
    ) = sort_create_update(manifest_resource_list, server_resource_list)
    assert create_result == expected_create_result
    assert update_result == []


@pytest.mark.unit
def test_sort_create_update_update():
    resource_1 = models.DataCategory(
        id=1,
        organization_fides_key=1,
        fides_key="some_resource",
        name="Test resource 1",
        description="Test Description",
    )
    resource_2 = models.DataCategory(
        organization_fides_key=1,
        fides_key="some_resource",
        name="Test System 2",
        description="Test Description",
    )
    expected_update_result = [resource_2]
    manifest_resource_list = [resource_2]
    server_resource_list = [resource_1]

    (
        create_result,
        update_result,
    ) = sort_create_update(manifest_resource_list, server_resource_list)
    assert [] == create_result
    assert expected_update_result == update_result