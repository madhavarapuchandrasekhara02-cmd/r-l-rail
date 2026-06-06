/**
 * SchemaOrg — Lightweight server-safe JSON-LD injector.
 * Renders structured data schema into <script type="application/ld+json">.
 * Zero client JS cost. No UI impact.
 */

interface SchemaOrgProps {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

export default function SchemaOrg({ schema }: SchemaOrgProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(Array.isArray(schema) ? schema : schema, null, 0),
      }}
    />
  );
}
