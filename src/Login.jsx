import React, { useState } from 'react'
import { supabase } from './supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ValidatedForm, ToastContainer } from './components/forms/ValidatedForm'
import { loginSchema } from './schemas/validationSchemas'
import { useToast } from './hooks/useToast'

export default function Login() {
  const navigate = useNavigate()
  const { toasts, removeToast, toast } = useToast()

  const handleLogin = async (data) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: data.email, 
        password: data.password 
      })
      
      if (authError) {
        throw new Error(authError.message)
      } else if (authData.session) {
        toast.success('¡Bienvenido! Inicio de sesión exitoso')
        navigate('/dashboard')
      } else {
        throw new Error('Login succeeded but no session was returned.')
      }
    } catch (err) {
      throw new Error(err.message || 'Error inesperado durante el inicio de sesión')
    }
  }

  const defaultValues = {
    email: '',
    password: ''
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white shadow-2xl rounded-2xl px-8 py-8 w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Bienvenido</h2>
            <p className="text-gray-600">Inicia sesión en tu cuenta</p>
          </div>

          <ValidatedForm
            schema={loginSchema}
            onSubmit={handleLogin}
            defaultValues={defaultValues}
            className="space-y-6"
          >
            {({ register, errors, isSubmitting, isValid, FormField, SubmitButton }) => (
              <>
                <FormField
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  placeholder="tu@ejemplo.com"
                  required
                />

                <FormField
                  label="Contraseña"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                />

                <SubmitButton 
                  className="w-full shadow-md hover:shadow-lg"
                >
                  Iniciar Sesión
                </SubmitButton>
              </>
            )}
          </ValidatedForm>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <a href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors">
                Regístrate aquí
              </a>
            </p>
          </div>
        </div>
      </div>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  )
}