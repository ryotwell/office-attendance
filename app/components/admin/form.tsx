"use client"

import * as React from "react"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

export function SubmitButton({
  pending,
  children,
  pendingLabel = "Menyimpan…",
}: {
  pending: boolean
  children: React.ReactNode
  pendingLabel?: string
}) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : children}
    </Button>
  )
}

export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
  hint,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
  hint?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
      />
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}

export function FormSelect({
  label,
  name,
  defaultValue,
  options,
  required,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  options: Array<{ value: string; label: string }>
  required?: boolean
  hint?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="">— Pilih —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}

export function FormTextarea({
  label,
  name,
  defaultValue,
  required,
  hint,
}: {
  label: string
  name: string
  defaultValue?: string
  required?: boolean
  hint?: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <Textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        required={required}
      />
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}