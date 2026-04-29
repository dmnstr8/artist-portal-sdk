/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactNode } from 'react';

export type NavLinkItem = {
  label: string;
  href: string;
  desktopLabel?: ReactNode;
};
