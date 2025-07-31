import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '../../hooks/useToast';

// Form field component with validation
export const FormField = ({
  label,
  name,
  type = 'text',
  register,
  error,
  placeholder,
  options = [],
  rows,
  className = '',
  required = false,
  ...props
}) => {
  const baseInputClasses = `
    w-full px-3 py-2 rounded-md border transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
    disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
    ${error 
      ? 'border-destructive bg-destructive/10 text-destructive placeholder-destructive/50 focus:border-destructive focus:ring-destructive' 
      : 'border-border bg-background text-foreground placeholder-muted-foreground'
    }
    ${className}
  `;

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select {...register(name)} className={baseInputClasses} {...props}>
            <option value="">{placeholder || 'Seleccionar...'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <textarea
            {...register(name)}
            className={baseInputClasses}
            placeholder={placeholder}
            rows={rows || 3}
            {...props}
          />
        );
      
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register(name)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...props}
            />
            <label className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          </div>
        );
      
      default:
        return (
          <input
            type={type}
            {...register(name)}
            className={baseInputClasses}
            placeholder={placeholder}
            autoComplete={props.autoComplete || 'off'}
            {...props}
          />
        );
    }
  };

  if (type === 'checkbox') {
    return (
      <div className="space-y-1">
        {renderInput()}
        {error && (
          <p className="text-sm text-destructive flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error.message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {error && (
        <p className="text-sm text-destructive flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error.message}
        </p>
      )}
    </div>
  );
};

// Submit button component
export const SubmitButton = ({ 
  isSubmitting, 
  isValid, 
  children, 
  className = '',
  variant = 'primary',
  ...props 
}) => {
  const getButtonClasses = () => {
    const baseClasses = `
      px-4 py-2 rounded-md font-medium transition-all duration-200 
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      ${className}
    `;

    switch (variant) {
      case 'secondary':
        return `${baseClasses} bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500`;
      case 'danger':
        return `${baseClasses} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
      default:
        return `${baseClasses} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
    }
  };

  return (
    <button
      type="submit"
      disabled={isSubmitting || !isValid}
      className={getButtonClasses()}
      {...props}
    >
      {isSubmitting ? (
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Procesando...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Main form wrapper component
export const ValidatedForm = ({
  schema,
  onSubmit,
  defaultValues = {},
  children,
  className = '',
  resetOnSubmit = false
}) => {
  const { toast } = useToast();
  
  // Early validation for children prop
  if (!children) {
    console.error('ValidatedForm: children prop is required');
    return <div>Error: Form content is required</div>;
  }
  
  if (typeof children !== 'function') {
    console.error('ValidatedForm: children must be a function, received:', typeof children);
    console.error('ValidatedForm: children value:', children);
    return <div>Error: Form children must be a function</div>;
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    reset,
    watch,
    setValue,
    getValues
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur' // Changed from 'onChange' to prevent keyboard interruption
  });

  const onFormSubmit = async (data) => {
    try {
      await onSubmit(data);
      if (resetOnSubmit) {
        reset();
      }
      // Remove automatic success toast to prevent conflicts with component-specific toasts
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(error.message || 'Ocurrió un error al procesar la información');
      throw error; // Re-throw so parent component can handle it
    }
  };

  // Create wrapped components that automatically include register and errors
  const WrappedFormField = (props) => (
    <FormField 
      {...props} 
      register={register} 
      error={errors[props.name]} 
    />
  );

  const WrappedSubmitButton = (props) => (
    <SubmitButton 
      {...props} 
      isSubmitting={isSubmitting} 
      isValid={isValid} 
    />
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className={className}>
      {children({
        register,
        errors,
        isSubmitting,
        isValid,
        watch,
        setValue,
        getValues,
        FormField: WrappedFormField,
        SubmitButton: WrappedSubmitButton
      })}
    </form>
  );
};

// Toast Container component
export const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast component (if not already imported)
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out max-w-sm";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200`;
      case 'error':
        return `${baseStyles} bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200`;
      default:
        return `${baseStyles} bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 w-0 flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            className="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
