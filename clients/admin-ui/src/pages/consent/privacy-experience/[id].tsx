import { PRIVACY_REQUESTS_ROUTE } from "@fidesui/components";
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  Center,
  Heading,
  Spinner,
  Text,
} from "@fidesui/react";
import NextLink from "next/link";
import { useRouter } from "next/router";

import Layout from "~/features/common/Layout";
import { PRIVACY_EXPERIENCE_ROUTE } from "~/features/common/nav/v2/routes";
import { COMPONENT_MAP } from "~/features/privacy-experience/constants";
import PrivacyExperienceForm from "~/features/privacy-experience/form/PrivacyExperienceForm";
import { useGetExperienceConfigByIdQuery } from "~/features/privacy-experience/privacy-experience.slice";
import { ComponentType } from "~/types/api";

const OVERLAY_DESCRIPTION =
  "Configure the text of your privacy overlay, privacy banner, and the text of the buttons which users will click to accept, reject, manage, and save their preferences.";
const PRIVACY_CENTER_DESCRIPTION =
  "Configure this privacy center experience. You can update the text which will display above the privacy notices and choose whether you’d like users to access the privacy center with a link.";

const PrivacyExperienceDetailPage = () => {
  const router = useRouter();

  let experienceId = "";
  if (router.query.id) {
    experienceId = Array.isArray(router.query.id)
      ? router.query.id[0]
      : router.query.id;
  }

  const { data, isLoading } = useGetExperienceConfigByIdQuery(experienceId);

  if (isLoading) {
    return (
      <Layout title="Privacy experience">
        <Center>
          <Spinner />
        </Center>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Privacy experience">
        <Text>No privacy experience with id {experienceId} found.</Text>
      </Layout>
    );
  }

  const header =
    data.component === ComponentType.OVERLAY
      ? "Configure your consent overlay"
      : "Configure your privacy center";

  const description =
    data.component === ComponentType.OVERLAY
      ? OVERLAY_DESCRIPTION
      : PRIVACY_CENTER_DESCRIPTION;

  return (
    <Layout title={`Privacy experience ${data.component}`}>
      <Box mb={4}>
        <Heading
          fontSize="2xl"
          fontWeight="semibold"
          mb={2}
          data-testid="header"
        >
          {header}
        </Heading>
        <Box>
          <Breadcrumb
            fontWeight="medium"
            fontSize="sm"
            color="gray.600"
            data-testid="breadcrumbs"
          >
            <BreadcrumbItem>
              <NextLink href={PRIVACY_REQUESTS_ROUTE}>
                Privacy requests
              </NextLink>
            </BreadcrumbItem>
            {/* TODO: Add Consent breadcrumb once the page exists */}
            <BreadcrumbItem>
              <NextLink href={PRIVACY_EXPERIENCE_ROUTE}>
                Privacy experience
              </NextLink>
            </BreadcrumbItem>
            <BreadcrumbItem color="complimentary.500">
              <NextLink href="#">
                {COMPONENT_MAP.get(data.component || "") ?? data.component}
              </NextLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Box>
      </Box>
      <Box width={{ base: "100%", lg: "70%" }}>
        <Text fontSize="sm" mb={8}>
          {description}
        </Text>
        <Box data-testid="privacy-experience-detail-page">
          <PrivacyExperienceForm privacyExperience={data} />
        </Box>
      </Box>
    </Layout>
  );
};

export default PrivacyExperienceDetailPage;
