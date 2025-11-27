import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

// Form component that passes through form context
export const Form = ({ children, ...props }: any) => <form {...props}>{children}</form>;

// FormField using Controller from react-hook-form
export const FormField = ({ control, name, render }: any) => (
  <Controller
    control={control}
    name={name}
    render={({ field, fieldState }) => render({ 
      field, 
      fieldState,
      formItemId: `form-item-${name}`,
    })}
  />
);

// Context to pass field state down
const FormItemContext = React.createContext<any>({});

export const FormItem = ({ children, className }: any) => (
  <div className={`mb-4 ${className || ''}`}>{children}</div>
);

export const FormLabel = ({ children, className }: any) => (
  <label className={`block text-sm font-medium mb-1 ${className || ''}`}>{children}</label>
);

export const FormControl = ({ children }: any) => <div>{children}</div>;

export const FormMessage = ({ children, className }: any) => {
  return children ? (
    <p className={`text-sm text-red-600 mt-1 ${className || ''}`}>{children}</p>
  ) : null;
};

export default Form;
