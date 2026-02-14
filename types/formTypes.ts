import type { ReactElement } from "react";
import {
  ControllerFieldState,
  ControllerRenderProps,
  FieldValues,
  UseFormStateReturn,
} from "react-hook-form";

export type FormColumnsType = FormColumnType[];
export type FormColumnType = {
  label: string;
  prop: string;
  component?: (props: {
    field: ControllerRenderProps<FieldValues, string>;
    fieldState: ControllerFieldState;
    formState: UseFormStateReturn<any>;
  }) => ReactElement;
};
export interface NumberInputSheetHandle {
  present: () => void;
  dismiss: () => void;
}

export interface NumberInputSheetProps {
  title: string;
  unit: string;
  value: string;
  onConfirm: (value: string) => void;
}

export interface NumberInputControlProps {
  key: string;
  title: string;
  unit: string;
  value?: string;
}
