"""This module handles finding and parsing fides configuration files."""
# pylint: disable=C0115,C0116, E0213

import os
from typing import Dict, Optional, Tuple

import toml

from pydantic.env_settings import SettingsSourceCallable
from pydantic import BaseModel, BaseSettings, validator, AnyHttpUrl

from fidesctl.core.utils import echo_red, generate_request_headers


class MissingConfig(Exception):
    """Custom exception for when no valid configuration file is provided."""

    def __init__(self) -> None:
        message: str = "No configuration file provided!"
        super().__init__(message)


class FidesSettings(BaseSettings):
    """Class used as a base model for configuration subsections."""

    class Config:

        # Set environment variables to take precedence over init values
        @classmethod
        def customise_sources(
            cls,
            init_settings: SettingsSourceCallable,
            env_settings: SettingsSourceCallable,
            file_secret_settings: SettingsSourceCallable,
        ) -> Tuple[SettingsSourceCallable, ...]:
            return env_settings, init_settings


class UserSettings(FidesSettings):
    """Class used to store values from the 'user' section of the config."""

    user_id: str
    api_key: str
    request_headers: Dict[str, str] = dict()

    # Automatically generate the request_headers on object creation
    @validator("request_headers", pre=True, always=True)
    def get_request_headers(
        cls: BaseModel, value: Optional[Dict], values: Dict
    ) -> Dict[str, str]:
        return generate_request_headers(values["user_id"], values["api_key"])

    class Config:
        env_prefix = "FIDES__USER__"


class CLISettings(FidesSettings):
    """Class used to store values from the 'cli' section of the config."""

    server_url: AnyHttpUrl

    class Config:
        env_prefix = "FIDES__CLI__"


class FidesConfig(BaseModel):
    """Umbrella class that encapsulates all of the config subsections."""

    user: UserSettings
    cli: CLISettings


def get_config(config_path: str = "") -> FidesConfig:
    """
    Attempt to read config file from:
    a) passed in configuration, if it exists
    b) env var FIDES_CONFIG_PATH
    b) local directory
    c) home directory

    This will fail on the first encountered bad conf file.
    """

    possible_config_locations = [
        config_path,
        os.getenv("FIDES_CONFIG_PATH", ""),
        os.path.join(os.curdir, "fides.toml"),
        os.path.join(os.path.expanduser("~"), "fides.toml"),
    ]

    for file_location in possible_config_locations:
        if file_location != "" and os.path.isfile(file_location):
            try:
                settings = toml.load(file_location)
                fides_config = FidesConfig(
                    user=UserSettings.parse_obj(settings["user"]),
                    cli=CLISettings.parse_obj(settings["cli"]),
                )
            except IOError:
                echo_red(f"Error reading config file from {file_location}")
            break
    else:
        raise MissingConfig
    return fides_config