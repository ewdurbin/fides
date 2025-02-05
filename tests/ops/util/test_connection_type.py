import pytest

from fides.api.models.connectionconfig import ConnectionType
from fides.api.models.policy import ActionType
from fides.api.schemas.connection_configuration.connection_config import SystemType
from fides.api.service.connectors.saas.connector_registry_service import (
    ConnectorRegistry,
)
from fides.api.util.connection_type import get_connection_types


def test_get_connection_types():
    data = get_connection_types()
    assert (
        len(data) == len(ConnectionType) + len(ConnectorRegistry.connector_types()) - 4
    )  # there are 4 connection types that are not returned by the endpoint

    assert {
        "identifier": ConnectionType.postgres.value,
        "type": SystemType.database.value,
        "human_readable": "PostgreSQL",
        "encoded_icon": None,
    } in data
    first_saas_type = ConnectorRegistry.connector_types().pop()
    first_saas_template = ConnectorRegistry.get_connector_template(first_saas_type)
    assert {
        "identifier": first_saas_type,
        "type": SystemType.saas.value,
        "human_readable": first_saas_template.human_readable,
        "encoded_icon": first_saas_template.icon,
    } in data

    assert "saas" not in [item.identifier for item in data]
    assert "https" not in [item.identifier for item in data]
    assert "custom" not in [item.identifier for item in data]
    assert "manual" not in [item.identifier for item in data]

    assert {
        "identifier": ConnectionType.sovrn.value,
        "type": SystemType.email.value,
        "human_readable": "Sovrn",
        "encoded_icon": None,
    } in data


DOORDASH = "doordash"
GOOGLE_ANALYTICS = "google_analytics"
MAILCHIMP_TRANSACTIONAL = "mailchimp_transactional"
SEGMENT = "segment"
STRIPE = "stripe"
ZENDESK = "zendesk"


@pytest.fixture
def connection_type_objects():
    google_analytics_template = ConnectorRegistry.get_connector_template(
        GOOGLE_ANALYTICS
    )
    mailchimp_transactional_template = ConnectorRegistry.get_connector_template(
        MAILCHIMP_TRANSACTIONAL
    )
    stripe_template = ConnectorRegistry.get_connector_template("stripe")
    zendesk_template = ConnectorRegistry.get_connector_template("zendesk")
    doordash_template = ConnectorRegistry.get_connector_template(DOORDASH)
    segment_template = ConnectorRegistry.get_connector_template(SEGMENT)

    return {
        ConnectionType.postgres.value: {
            "identifier": ConnectionType.postgres.value,
            "type": SystemType.database.value,
            "human_readable": "PostgreSQL",
            "encoded_icon": None,
        },
        ConnectionType.manual_webhook.value: {
            "identifier": ConnectionType.manual_webhook.value,
            "type": SystemType.manual.value,
            "human_readable": "Manual Process",
            "encoded_icon": None,
        },
        GOOGLE_ANALYTICS: {
            "identifier": GOOGLE_ANALYTICS,
            "type": SystemType.saas.value,
            "human_readable": google_analytics_template.human_readable,
            "encoded_icon": google_analytics_template.icon,
        },
        MAILCHIMP_TRANSACTIONAL: {
            "identifier": MAILCHIMP_TRANSACTIONAL,
            "type": SystemType.saas.value,
            "human_readable": mailchimp_transactional_template.human_readable,
            "encoded_icon": mailchimp_transactional_template.icon,
        },
        SEGMENT: {
            "identifier": SEGMENT,
            "type": SystemType.saas.value,
            "human_readable": segment_template.human_readable,
            "encoded_icon": segment_template.icon,
        },
        STRIPE: {
            "identifier": STRIPE,
            "type": SystemType.saas.value,
            "human_readable": stripe_template.human_readable,
            "encoded_icon": stripe_template.icon,
        },
        ZENDESK: {
            "identifier": ZENDESK,
            "type": SystemType.saas.value,
            "human_readable": zendesk_template.human_readable,
            "encoded_icon": zendesk_template.icon,
        },
        DOORDASH: {
            "identifier": DOORDASH,
            "type": SystemType.saas.value,
            "human_readable": doordash_template.human_readable,
            "encoded_icon": doordash_template.icon,
        },
        ConnectionType.sovrn.value: {
            "identifier": ConnectionType.sovrn.value,
            "type": SystemType.email.value,
            "human_readable": "Sovrn",
            "encoded_icon": None,
        },
        ConnectionType.attentive.value: {
            "identifier": ConnectionType.attentive.value,
            "type": SystemType.email.value,
            "human_readable": "Attentive",
            "encoded_icon": None,
        },
    }


@pytest.mark.parametrize(
    "action_types, assert_in_data, assert_not_in_data",
    [
        (
            [ActionType.consent],
            [GOOGLE_ANALYTICS, MAILCHIMP_TRANSACTIONAL, ConnectionType.sovrn.value],
            [
                ConnectionType.postgres.value,
                ConnectionType.manual_webhook.value,
                DOORDASH,
                STRIPE,
                ZENDESK,
                SEGMENT,
                ConnectionType.attentive.value,
            ],
        ),
        (
            [ActionType.access],
            [
                ConnectionType.postgres.value,
                ConnectionType.manual_webhook.value,
                DOORDASH,
                SEGMENT,
                STRIPE,
                ZENDESK,
            ],
            [
                GOOGLE_ANALYTICS,
                MAILCHIMP_TRANSACTIONAL,
                ConnectionType.sovrn.value,
                ConnectionType.attentive.value,
            ],
        ),
        (
            [ActionType.erasure],
            [
                ConnectionType.postgres.value,
                SEGMENT,  # segment has DPR so it is an erasure
                STRIPE,
                ZENDESK,
                ConnectionType.attentive.value,
            ],
            [
                GOOGLE_ANALYTICS,
                MAILCHIMP_TRANSACTIONAL,
                ConnectionType.manual_webhook.value,  # manual webhook is not erasure
                DOORDASH,  # doordash does not have erasures
                ConnectionType.sovrn.value,
            ],
        ),
        (
            [ActionType.consent, ActionType.access],
            [
                GOOGLE_ANALYTICS,
                MAILCHIMP_TRANSACTIONAL,
                ConnectionType.sovrn.value,
                ConnectionType.postgres.value,
                ConnectionType.manual_webhook.value,
                DOORDASH,
                SEGMENT,
                STRIPE,
                ZENDESK,
            ],
            [
                ConnectionType.attentive.value,
            ],
        ),
        (
            [ActionType.consent, ActionType.erasure],
            [
                GOOGLE_ANALYTICS,
                MAILCHIMP_TRANSACTIONAL,
                ConnectionType.sovrn.value,
                ConnectionType.postgres.value,
                SEGMENT,  # segment has DPR so it is an erasure
                STRIPE,
                ZENDESK,
                ConnectionType.attentive.value,
            ],
            [
                ConnectionType.manual_webhook.value,  # manual webhook is not erasure
                DOORDASH,  # doordash does not have erasures
            ],
        ),
        (
            [ActionType.access, ActionType.erasure],
            [
                ConnectionType.postgres.value,
                ConnectionType.manual_webhook.value,
                DOORDASH,
                SEGMENT,
                STRIPE,
                ZENDESK,
                ConnectionType.attentive.value,
            ],
            [
                GOOGLE_ANALYTICS,
                MAILCHIMP_TRANSACTIONAL,
                ConnectionType.sovrn.value,
            ],
        ),
    ],
)
def test_get_connection_types_action_type_filter(
    action_types, assert_in_data, assert_not_in_data, connection_type_objects
):
    data = get_connection_types(action_types=action_types)

    for connection_type in assert_in_data:
        obj = connection_type_objects[connection_type]
        assert obj in data

    for connection_type in assert_not_in_data:
        obj = connection_type_objects[connection_type]
        assert obj not in data
