/**
 * Exports various parts of the privacy declaration form for flexibility
 */

import {
  Box,
  BoxProps,
  Button,
  ButtonGroup,
  GreenCheckCircleIcon,
  Heading,
  Stack,
  Text,
  useDisclosure,
} from "@fidesui/react";
import {
  CustomFieldsList,
  CustomFieldValues,
  useCustomFields,
} from "common/custom-fields";
import { Form, Formik, FormikHelpers, useFormikContext } from "formik";
import { useMemo, useState } from "react";
import * as Yup from "yup";

import ConfirmationModal from "~/features/common/ConfirmationModal";
import { CustomSelect, CustomTextInput } from "~/features/common/form/inputs";
import { FormGuard } from "~/features/common/hooks/useIsAnyFormDirty";
import {
  DataCategory,
  Dataset,
  DataSubject,
  DataUse,
  PrivacyDeclaration,
  ResourceTypes,
} from "~/types/api";

import { PrivacyDeclarationWithId } from "./types";

export const ValidationSchema = Yup.object().shape({
  data_categories: Yup.array(Yup.string())
    .min(1, "Must assign at least one data category")
    .label("Data categories"),
  data_use: Yup.string().required().label("Data use"),
  data_subjects: Yup.array(Yup.string())
    .min(1, "Must assign at least one data subject")
    .label("Data subjects"),
});

export type FormValues = PrivacyDeclarationWithId & {
  customFieldValues: CustomFieldValues;
};

const defaultInitialValues: FormValues = {
  data_categories: [],
  data_subjects: [],
  data_use: "",
  dataset_references: [],
  customFieldValues: {},
  id: "",
};

const transformPrivacyDeclarationToHaveId = (
  privacyDeclaration: PrivacyDeclaration
) => {
  // TODO: there's a typing problem here: the backend types still show PrivacyDeclaration
  // instead of PrivacyDeclarationResponse (which has an id)
  // @ts-ignore
  const { id, name, data_use: dataUse } = privacyDeclaration;
  let declarationId: string | undefined = id;
  if (!declarationId) {
    declarationId = name ? `${dataUse} - ${name}` : dataUse;
  }
  return {
    ...privacyDeclaration,
    id: declarationId,
  };
};

export const transformPrivacyDeclarationsToHaveId = (
  privacyDeclarations: PrivacyDeclaration[]
): PrivacyDeclarationWithId[] =>
  privacyDeclarations.map(transformPrivacyDeclarationToHaveId);

export interface DataProps {
  allDataCategories: DataCategory[];
  allDataUses: DataUse[];
  allDataSubjects: DataSubject[];
  allDatasets?: Dataset[];
}

export const PrivacyDeclarationFormComponents = ({
  allDataUses,
  allDataCategories,
  allDataSubjects,
  allDatasets,
  onDelete,
  privacyDeclarationId,
  includeCustomFields,
}: DataProps &
  Pick<Props, "onDelete"> & {
    privacyDeclarationId?: string;
    includeCustomFields?: boolean;
  }) => {
  const { dirty, isSubmitting, isValid, initialValues } =
    useFormikContext<FormValues>();
  const deleteModal = useDisclosure();

  const datasetOptions = allDatasets
    ? allDatasets.map((d) => ({
        label: d.name ?? d.fides_key,
        value: d.fides_key,
      }))
    : [];

  const handleDelete = async () => {
    await onDelete(transformPrivacyDeclarationToHaveId(initialValues));
    deleteModal.onClose();
  };

  const deleteDisabled = initialValues.data_use === "";

  return (
    <Stack spacing={4}>
      <CustomSelect
        id="data_use"
        label="Data use"
        name="data_use"
        options={allDataUses.map((data) => ({
          value: data.fides_key,
          label: data.fides_key,
        }))}
        tooltip="What is the system using the data for. For example, is it for third party advertising or perhaps simply providing system operations."
        variant="stacked"
        singleValueBlock
        isDisabled={!!privacyDeclarationId}
      />
      <CustomTextInput
        id="name"
        label="Processing Activity"
        name="name"
        variant="stacked"
        tooltip="The personal data processing activity or activities associated with this data use."
        disabled={!!privacyDeclarationId}
      />
      <CustomSelect
        name="data_categories"
        label="Data categories"
        options={allDataCategories.map((data) => ({
          value: data.fides_key,
          label: data.fides_key,
        }))}
        tooltip="What type of data is your system processing? This could be various types of user or system data."
        isMulti
        variant="stacked"
      />
      <CustomSelect
        name="data_subjects"
        label="Data subjects"
        options={allDataSubjects.map((data) => ({
          value: data.fides_key,
          label: data.fides_key,
        }))}
        tooltip="Whose data are you processing? This could be customers, employees or any other type of user in your system."
        isMulti
        variant="stacked"
      />
      {allDatasets ? (
        <CustomSelect
          name="dataset_references"
          label="Dataset references"
          options={datasetOptions}
          tooltip="Referenced Dataset fides keys used by the system."
          isMulti
          variant="stacked"
        />
      ) : null}
      {includeCustomFields ? (
        <CustomFieldsList
          resourceType={ResourceTypes.PRIVACY_DECLARATION}
          resourceFidesKey={privacyDeclarationId}
        />
      ) : null}
      <ButtonGroup size="sm" display="flex" justifyContent="space-between">
        <Button
          variant="outline"
          onClick={deleteModal.onOpen}
          disabled={deleteDisabled}
          data-testid="delete-btn"
        >
          Delete
        </Button>
        <Button
          type="submit"
          colorScheme="primary"
          disabled={!dirty || !isValid}
          isLoading={isSubmitting}
          data-testid="save-btn"
        >
          Save
        </Button>
      </ButtonGroup>
      <ConfirmationModal
        onConfirm={handleDelete}
        title="Delete data use"
        message="Are you sure you want to delete this data use? This action can't be undone."
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        isCentered
      />
    </Stack>
  );
};

export const transformPrivacyDeclarationToFormValues = (
  privacyDeclaration?: PrivacyDeclarationWithId,
  customFieldValues?: CustomFieldValues
): FormValues =>
  privacyDeclaration
    ? {
        ...privacyDeclaration,
        customFieldValues: customFieldValues || {},
      }
    : defaultInitialValues;

/**
 * Hook to supply all data needed for the privacy declaration form
 * Purposefully excludes redux queries so that this can be used across apps
 */
export const usePrivacyDeclarationForm = ({
  onSubmit,
  initialValues: passedInInitialValues,
  allDataUses,
  privacyDeclarationId,
}: Omit<Props, "onDelete"> & Pick<DataProps, "allDataUses">) => {
  const { customFieldValues, upsertCustomFields } = useCustomFields({
    resourceType: ResourceTypes.PRIVACY_DECLARATION,
    resourceFidesKey: privacyDeclarationId,
  });

  const initialValues = useMemo(
    () =>
      transformPrivacyDeclarationToFormValues(
        passedInInitialValues,
        customFieldValues
      ),
    [passedInInitialValues, customFieldValues]
  );

  const [showSaved, setShowSaved] = useState(false);

  const title = useMemo(() => {
    const thisDataUse = allDataUses.filter(
      (du) => du.fides_key === initialValues.data_use
    )[0];
    if (thisDataUse) {
      return initialValues.name
        ? `${thisDataUse.name} - ${initialValues.name}`
        : thisDataUse.name;
    }
    return undefined;
  }, [allDataUses, initialValues]);

  const handleSubmit = async (
    values: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const { customFieldValues: formCustomFieldValues, ...declaration } = values;
    const success = await onSubmit(declaration, formikHelpers);
    if (success) {
      // find the matching resource based on data use and name
      const customFieldResource = success.filter(
        (pd) =>
          pd.data_use === values.data_use &&
          // name can be undefined, so avoid comparing undefined == ""
          // (which we want to be true) - they both mean the PD has no name
          (pd.name ? pd.name === values.name : true)
      );
      if (customFieldResource.length > 0) {
        await upsertCustomFields({
          customFieldValues: formCustomFieldValues,
          fides_key: customFieldResource[0].id,
        });
      }
      // Reset state such that isDirty will be checked again before next save
      formikHelpers.resetForm({ values });
      setShowSaved(true);
    }
  };

  const renderHeader = ({
    dirty,
    boxProps,
    /** Allow overriding showing the saved indicator */
    hideSaved,
  }: {
    dirty: boolean;
    hideSaved?: boolean;
    boxProps?: BoxProps;
  }) => (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      {...boxProps}
    >
      {title ? (
        <Heading as="h4" size="xs" fontWeight="medium" mr={4}>
          {title}
        </Heading>
      ) : null}
      {!hideSaved && showSaved && !dirty && initialValues.data_use ? (
        <Text fontSize="sm" data-testid="saved-indicator">
          <GreenCheckCircleIcon /> Saved
        </Text>
      ) : null}
    </Box>
  );

  return { handleSubmit, renderHeader, initialValues };
};

interface Props {
  onSubmit: (
    values: PrivacyDeclarationWithId,
    formikHelpers: FormikHelpers<FormValues>
  ) => Promise<PrivacyDeclarationWithId[] | undefined>;
  onDelete: (
    declaration: PrivacyDeclarationWithId
  ) => Promise<PrivacyDeclarationWithId[] | undefined>;
  initialValues?: PrivacyDeclarationWithId;
  privacyDeclarationId?: string;
  includeCustomFields?: boolean;
}

export const PrivacyDeclarationForm = ({
  onSubmit,
  initialValues: passedInInitialValues,
  onDelete,
  ...dataProps
}: Props & DataProps) => {
  const { handleSubmit, renderHeader, initialValues } =
    usePrivacyDeclarationForm({
      onSubmit,
      initialValues: passedInInitialValues,
      allDataUses: dataProps.allDataUses,
      privacyDeclarationId: passedInInitialValues?.id,
    });

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={ValidationSchema}
    >
      {({ dirty }) => (
        <Form>
          <FormGuard id="PrivacyDeclaration" name="New Privacy Declaration" />
          <Stack spacing={4}>
            <Box data-testid="header">{renderHeader({ dirty })}</Box>
            <PrivacyDeclarationFormComponents
              onDelete={onDelete}
              {...dataProps}
            />
          </Stack>
        </Form>
      )}
    </Formik>
  );
};
