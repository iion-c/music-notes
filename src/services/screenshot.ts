import html2canvas from 'html2canvas';

export async function captureElementAsImage(element: HTMLElement): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2.5, // Alta densidad de píxeles para notación musical nítida
    backgroundColor: '#0f172a', // Fondo elegante slate-900 de la app
    logging: false,
    useCORS: true
  });
  return canvas.toDataURL('image/png');
}

export async function downloadElementScreenshot(element: HTMLElement, filename: string = 'pentagrama-nota.png'): Promise<void> {
  const dataUrl = await captureElementAsImage(element);
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyElementToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const dataUrl = await captureElementAsImage(element);
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    if ((navigator.clipboard as any) && (window as any).ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error al copiar imagen al portapapeles:', err);
    return false;
  }
}
