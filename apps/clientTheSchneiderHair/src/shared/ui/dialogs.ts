export function confirmDialog(message: string): boolean {
  return window.confirm(message);
}

export function alertDialog(message: string): void {
  window.alert(message);
}
