import os
from typing import Dict, Generator, List
from uuid import uuid4

import pytest
from sqlalchemy.orm import Session

from fides.api.ctl.sql_models import Dataset as CtlDataset
from fides.api.models.connectionconfig import (
    AccessLevel,
    ConnectionConfig,
    ConnectionType,
)
from fides.api.models.datasetconfig import DatasetConfig
from fides.api.schemas.connection_configuration.connection_secrets_snowflake import (
    SnowflakeSchema,
)


@pytest.fixture(scope="function")
def snowflake_connection_config_without_secrets(
    db: Session,
) -> Generator:
    """
    Returns a Snowflake ConnectionConfig without secrets
    attached that is safe to usein any tests.
    """
    connection_config = ConnectionConfig.create(
        db=db,
        data={
            "name": str(uuid4()),
            "key": "my_snowflake_config",
            "connection_type": ConnectionType.snowflake,
            "access": AccessLevel.write,
        },
    )
    yield connection_config
    connection_config.delete(db)


@pytest.fixture(scope="function")
def snowflake_connection_config(
    db: Session,
    integration_config: Dict[str, str],
    snowflake_connection_config_without_secrets: ConnectionConfig,
) -> Generator:
    """
    Returns a Snowflake ConectionConfig with secrets attached if secrets are present
    in the configuration.
    """
    snowflake_connection_config = snowflake_connection_config_without_secrets
    uri = integration_config.get("snowflake", {}).get("external_uri") or os.environ.get(
        "SNOWFLAKE_TEST_URI"
    )
    if uri is not None:
        schema = SnowflakeSchema(url=uri)
        snowflake_connection_config.secrets = schema.dict()
        snowflake_connection_config.save(db=db)
    yield snowflake_connection_config


@pytest.fixture
def snowflake_example_test_dataset_config(
    snowflake_connection_config: ConnectionConfig,
    db: Session,
    example_datasets: List[Dict],
) -> Generator:
    dataset = example_datasets[2]
    fides_key = dataset["fides_key"]

    ctl_dataset = CtlDataset.create_from_dataset_dict(db, dataset)

    dataset_config = DatasetConfig.create(
        db=db,
        data={
            "connection_config_id": snowflake_connection_config.id,
            "fides_key": fides_key,
            "ctl_dataset_id": ctl_dataset.id,
        },
    )
    yield dataset_config
    dataset_config.delete(db=db)
    ctl_dataset.delete(db=db)
