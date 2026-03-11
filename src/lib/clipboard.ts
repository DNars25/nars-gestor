/**
 * Copia texto para o clipboard com fallback para HTTP (sem HTTPS).
 * navigator.clipboard.writeText requer contexto seguro (HTTPS ou localhost).
 * Em HTTP puro, usa document.execCommand('copy') como fallback.
 */
export async function copyToClipboard(text: string): Promise<void> {
  // Método moderno — funciona em HTTPS e localhost
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback via textarea + execCommand — funciona em HTTP
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!ok) throw new Error('Falha ao copiar')
}
