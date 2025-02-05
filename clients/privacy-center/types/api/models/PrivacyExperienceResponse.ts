/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { ComponentType } from "./ComponentType";
import type { ExperienceConfigResponse } from "./ExperienceConfigResponse";
import type { PrivacyNoticeRegion } from "./PrivacyNoticeRegion";
import type { PrivacyNoticeResponseWithUserPreferences } from "./PrivacyNoticeResponseWithUserPreferences";

/**
 * An API representation of a PrivacyExperience used for response payloads
 */
export type PrivacyExperienceResponse = {
  region: PrivacyNoticeRegion;
  component?: ComponentType;
  experience_config?: ExperienceConfigResponse;
  id: string;
  created_at: string;
  updated_at: string;
  show_banner?: boolean;
  privacy_notices?: Array<PrivacyNoticeResponseWithUserPreferences>;
};
