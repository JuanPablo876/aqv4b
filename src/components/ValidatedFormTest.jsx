import React from 'react';
import { ValidatedForm } from './forms/ValidatedForm';
import { z } from 'zod';

// Proper Zod schema for testing
const testSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters')
});

export default function ValidatedFormTest() {
  const handleSubmit = (data) => {
    console.log('Form submitted:', data);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">ValidatedForm Test</h1>
      
      <ValidatedForm
        schema={testSchema}
        onSubmit={handleSubmit}
        defaultValues={{ name: '' }}
      >
        {({ FormField, SubmitButton }) => (
          <>
            <FormField
              name="name"
              label="Test Name"
              placeholder="Enter a name"
              required
            />
            <SubmitButton>Submit Test</SubmitButton>
          </>
        )}
      </ValidatedForm>
    </div>
  );
}
