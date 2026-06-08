import { useState } from 'react'

export const useAuthValidation = () => {
  const [inputError, setInputError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const resetErrors = () => {
    setInputError('')
    setPasswordError('')
  }

  const validateInput = (input: string) => {
    resetErrors();
    if (!input) {
      setInputError('This field is required')
      return false
    }
    // BYPASSING FRONTEND VALIDATION TO ENSURE IT DOES NOT BLOCK CORRECT DATA
    // We let the backend handle the specific regex checks
    return true
  }

  const validatePassword = (password: string) => {
    setPasswordError('')
    if (!password) {
      setPasswordError('Password is required')
      return false
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return false
    }

    return true
  }

  return {
    inputError,
    passwordError,
    setInputError,
    setPasswordError,
    resetErrors,
    validateInput,
    validatePassword,
  }
}
