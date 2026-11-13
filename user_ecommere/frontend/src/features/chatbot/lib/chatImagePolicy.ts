export interface ChatImagePolicyOptions {
  cloudName?: string;
  origin?: string;
}

const CLOUD_NAME_REGEX = /^[A-Za-z0-9_-]{1,64}$/;

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function checkCloudinaryBranch(url: URL, cloudName: unknown): boolean {
  if (url.protocol !== 'https:') {
    return false;
  }
  if (url.hostname !== 'res.cloudinary.com') {
    return false;
  }
  if (url.port !== '') {
    return false;
  }
  if (url.search !== '') {
    return false;
  }
  if (typeof cloudName !== 'string' || !CLOUD_NAME_REGEX.test(cloudName)) {
    return false;
  }
  const escapedCloudName = escapeRegExp(cloudName);
  const cloudinaryRegex = new RegExp(
    `^/${escapedCloudName}/image/upload/v\\d+/[A-Za-z0-9._~%\\/-]+$`,
  );
  return cloudinaryRegex.test(url.pathname);
}

function checkOriginBranch(url: URL, origin: unknown): boolean {
  if (typeof origin !== 'string' || origin === '' || origin === 'null') {
    return false;
  }
  if (url.origin !== origin) {
    return false;
  }
  if (url.pathname.toLowerCase().startsWith('/api')) {
    return false;
  }
  return true;
}

/**
 * Validates and normalizes image URLs for rendering in chatbot markdown answers.
 *
 * Security context (commit c16c9dac):
 * ChatMarkdown previously rendered only alt text to prevent data exfiltration
 * via prompt injection in model-generated markdown image URLs.
 * This function permits images ONLY from a strict allowlist:
 *  A) Shop's own Cloudinary cloud (image/upload delivery type with required version tag, no transformations)
 *  B) Shop's own origin (excluding any /api endpoints)
 * Everything else is rejected (returns null).
 */
export function getAllowedChatImageUrl(
  rawSrc: unknown,
  options?: ChatImagePolicyOptions,
): string | null {
  try {
    if (typeof rawSrc !== 'string') {
      return null;
    }

    const trimmed = rawSrc.trim();
    if (!trimmed || trimmed.length > 2048) {
      return null;
    }

    // Must contain no whitespace or control characters
    if (/\s/.test(trimmed)) {
      return null;
    }
    for (let i = 0; i < trimmed.length; i++) {
      const code = trimmed.charCodeAt(i);
      if (code < 32 || (code >= 127 && code <= 159)) {
        return null;
      }
    }

    // Reject any path traversal attempts as defence in depth
    if (
      trimmed.includes('..') ||
      /%2e%2e/i.test(trimmed) ||
      rawSrc.includes('..') ||
      /%2e%2e/i.test(rawSrc)
    ) {
      return null;
    }

    try {
      if (decodeURIComponent(trimmed).includes('..')) {
        return null;
      }
    } catch {
      return null;
    }

    // Parse with new URL with NO base argument so relative/protocol-relative URLs are rejected
    const url = new URL(trimmed);

    // No credentials or fragments
    if (url.username !== '' || url.password !== '' || url.hash !== '') {
      return null;
    }

    // Only web schemes (rejects blob:, javascript:, data:, file:, etc.)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return null;
    }

    // Pathname traversal check
    if (url.pathname.includes('..') || /%2e%2e/i.test(url.pathname)) {
      return null;
    }

    try {
      if (decodeURIComponent(url.pathname).includes('..')) {
        return null;
      }
    } catch {
      return null;
    }

    const cloudName =
      options && 'cloudName' in options
        ? options.cloudName
        : typeof import.meta !== 'undefined' && import.meta.env
          ? import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
          : undefined;

    const origin =
      options && 'origin' in options
        ? options.origin
        : typeof window !== 'undefined' && window.location
          ? window.location.origin
          : undefined;

    const isCloudinary = checkCloudinaryBranch(url, cloudName);
    const isOrigin = checkOriginBranch(url, origin);

    // Must match exactly ONE of the two branches
    if ((isCloudinary && !isOrigin) || (!isCloudinary && isOrigin)) {
      return url.href;
    }

    return null;
  } catch {
    return null;
  }
}

export default getAllowedChatImageUrl;
