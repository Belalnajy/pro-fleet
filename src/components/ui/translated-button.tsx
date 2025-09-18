"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { type VariantProps } from 'class-variance-authority'
import { buttonVariants } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { type TranslationKey } from '@/lib/translations'
import { cn } from '@/lib/utils'

interface TranslatedButtonProps extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  textKey: TranslationKey
  children?: React.ReactNode
  asChild?: boolean
}

export function TranslatedButton({ textKey, children, className, ...props }: TranslatedButtonProps) {
  const { t, dir } = useTranslation()

  return (
    <Button
      {...props}
      className={cn(
        className,
        dir === 'rtl' && "font-arabic"
      )}
    >
      {children || t(textKey)}
    </Button>
  )
}

// Common button components
export function SaveButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="save" />
}

export function CancelButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="cancel" variant="outline" />
}

export function DeleteButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="delete" variant="destructive" />
}

export function EditButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="edit" variant="outline" />
}

export function AddButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="add" />
}

export function SubmitButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="submit" type="submit" />
}

export function BackButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="back" variant="outline" />
}

export function NextButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="next" />
}

export function ConfirmButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="confirm" />
}

export function SignInButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="signIn" />
}

export function SignUpButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="signUp" />
}

export function SignOutButton(props: Omit<TranslatedButtonProps, 'textKey'>) {
  return <TranslatedButton {...props} textKey="signOut" variant="outline" />
}
