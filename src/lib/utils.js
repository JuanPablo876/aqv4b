// Utility function to combine CSS classes
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
}
