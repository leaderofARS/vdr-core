/**
 * @module certificate/generate
 *
 * @description
 * Certificate data preparation and URL utilities for the SipHeron VDR platform.
 *
 * A **SipHeron VDR Certificate** is a PDF document that proves a specific file
 * was cryptographically anchored to the Solana blockchain at a recorded timestamp.
 * It is suitable for legal compliance workflows, audit trails, and sharing with
 * third parties who need to verify document authenticity without accessing Solana
 * directly.
 *
 * > **Note:** Full PDF generation (binary rendering) requires either the SipHeron
 * > hosted API (`GET /api/hashes/:hash/certificate`) or a server-side PDF library
 * > (e.g. `pdfkit`). This module provides the **data layer** only — types and pure
 * > functions that prepare, build, and describe certificate payloads.
 *
 * ## Functions
 * - `generateCertificateId(anchor)` — Deterministic `CERT-<16 hex chars>` ID derived
 *   from `hash + timestamp`. The same anchor always produces the same certificate ID,
 *   allowing tamper-detection of the certificate itself.
 * - `buildCertificateUrl(hash, apiBaseUrl?, isPublic?)` — Constructs the SipHeron API
 *   download URL. `isPublic = true` (default) hits an unauthenticated endpoint.
 * - `prepareCertificateData(anchor, org)` — Assembles a `CertificateData` object
 *   ready for passing to a PDF renderer or API call.
 * - `getCertificateProofText(orgName, hash)` — Returns the formal legal text paragraph
 *   used on the face of every certificate.
 *
 * ## `CertificateData` interface
 * | Field                   | Description                                    |
 * |-------------------------|------------------------------------------------|
 * | `anchor`                | Full `AnchorResult` record.                    |
 * | `organizationName`      | Name printed on the certificate.               |
 * | `organizationWebsite`   | Optional URL for white-label branding.         |
 * | `organizationLogoUrl`   | Optional logo URL for white-label branding.    |
 * | `issuedAt`              | ISO 8601 generation timestamp.                 |
 * | `certificateId`         | Deterministic `CERT-*` ID (see above).         |
 */

import type { AnchorResult } from '../types'

export interface CertificateData {
  /** The anchor record this certificate represents */
  anchor: AnchorResult
  /** Organization name that anchored the document */
  organizationName: string
  /** Organization website (optional, for branding) */
  organizationWebsite?: string
  /** Organization logo URL (optional, for white-label) */
  organizationLogoUrl?: string
  /** ISO 8601 timestamp when the certificate was generated */
  issuedAt: string
  /** Deterministic certificate ID */
  certificateId: string
}

/**
 * Generate a deterministic certificate ID from anchor data.
 * The same anchor always produces the same certificate ID.
 * This allows verification that a certificate has not been tampered with.
 */
export function generateCertificateId(anchor: AnchorResult): string {
  const { createHash } = require('crypto') as typeof import('crypto')
  return 'CERT-' + createHash('sha256')
    .update(anchor.hash + anchor.timestamp)
    .digest('hex')
    .slice(0, 16)
    .toUpperCase()
}

/**
 * Build the certificate download URL for a given hash.
 * This URL is served by the SipHeron platform.
 *
 * @param hash - SHA-256 hash of the document
 * @param apiBaseUrl - API base URL
 * @param isPublic - true = no auth required, false = requires API key
 */
export function buildCertificateUrl(
  hash: string,
  apiBaseUrl = 'https://api.sipheron.com',
  isPublic = true
): string {
  const path = isPublic
    ? `/api/hashes/${hash}/certificate/public`
    : `/api/hashes/${hash}/certificate`
  return `${apiBaseUrl}${path}?download=true`
}

/**
 * Prepare certificate data from an anchor result.
 * Use this to build the data object before rendering.
 */
export function prepareCertificateData(
  anchor: AnchorResult,
  org: {
    name: string
    website?: string
    logoUrl?: string
  }
): CertificateData {
  return {
    anchor,
    organizationName: org.name,
    organizationWebsite: org.website,
    organizationLogoUrl: org.logoUrl,
    issuedAt: new Date().toISOString(),
    certificateId: generateCertificateId(anchor),
  }
}

/**
 * What the certificate proves — formal legal text.
 * Used in both the PDF certificate and any certificate UI rendering.
 */
export function getCertificateProofText(
  organizationName: string,
  hash: string
): string {
  return [
    `This certificate confirms that the document identified by the SHA-256 hash ${hash.slice(0, 16)}... ` +
    `was cryptographically anchored to the Solana blockchain at the timestamp stated herein. ` +
    `The anchoring was performed by ${organizationName} using the SipHeron Verified Document Registry.`,

    `The existence of this blockchain record proves that: (1) the anchoring party possessed a document ` +
    `producing this exact SHA-256 hash at the recorded timestamp; (2) the hash — and therefore the ` +
    `underlying document — has not been altered since anchoring, as any modification would produce ` +
    `a completely different hash.`,

    `This certificate does not constitute legal notarization and does not imply authorship, ` +
    `accuracy of content, or legal validity of the underlying document.`,
  ].join('\n\n')
}
