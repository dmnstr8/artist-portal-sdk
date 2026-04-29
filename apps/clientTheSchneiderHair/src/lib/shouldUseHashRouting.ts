/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Use hash routing when static file hosting or known dev hosts break browser history routing. */
export function shouldUseHashRouting(): boolean {
  const host = window.location.hostname;
  return (
    window.location.protocol === 'file:' ||
    host.endsWith('github.io') ||
    host === 'localhost' ||
    host === '127.0.0.1'
  );
}
