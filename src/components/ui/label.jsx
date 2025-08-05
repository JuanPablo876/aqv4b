import React from 'react'

// Simple cn utility
const cn = (...classes) => classes.filter(Boolean).join(' ')

export function Label({ htmlFor, className = '', children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
}
