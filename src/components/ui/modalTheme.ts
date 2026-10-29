/** Text tones for modal content in light vs dark chrome. */
export function modalTone(darkMode: boolean) {
  return {
    title: darkMode ? 'text-white' : 'text-gray-900',
    body: darkMode ? 'text-slate-300' : 'text-gray-600',
    strong: darkMode ? 'text-slate-100' : 'text-gray-800',
    muted: darkMode ? 'text-slate-400' : 'text-gray-500',
  }
}
