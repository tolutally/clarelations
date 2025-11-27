/**
 * Concatenate a list of class names into a single string. Falsy values are ignored. This helper
 * mimics the behaviour of popular clsx/cn utilities used in React projects and is used
 * throughout the components to conditionally apply Tailwind classes.
 */
export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(' ');
}