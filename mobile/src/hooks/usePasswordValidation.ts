import { useMemo, useState } from 'react'

export const usePasswordValidation = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [matchError, setMatchError] = useState('')

  const rules = useMemo(() => {
    const lengthRule = password.length >= 8
    const specialCharsRule = (password.match(/[^A-Za-z0-9]/g) || []).length >= 2
    const alphaNumericRule =
      (password.match(/[A-Za-z]/g) || []).length >= 2 &&
      (password.match(/[0-9]/g) || []).length >= 2

    return {
      lengthRule,
      specialCharsRule,
      alphaNumericRule,
      isStrong: lengthRule && specialCharsRule && alphaNumericRule,
    }
  }, [password])

  const validate = () => {
    setMatchError('')

    if (password !== confirmPassword) {
      setMatchError('Passwords do not match')
      return false
    }

    if (!rules.isStrong) {
      return false
    }

    return true
  }

  return {
    password,
    confirmPassword,
    setPassword,
    setConfirmPassword,
    matchError,
    rules,
    validate,
  }
}
