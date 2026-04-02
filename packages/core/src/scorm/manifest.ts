export interface ManifestOptions {
  title: string
  identifier?: string
  files: string[]
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function generateManifest(options: ManifestOptions): string {
  const identifier = options.identifier ?? 'kurikulum-course'
  const title = escapeXml(options.title)
  const fileEntries = options.files
    .map(f => `      <file href="${escapeXml(f)}"/>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}"
          version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="kurikulum-org">
    <organization identifier="kurikulum-org">
      <title>${title}</title>
      <item identifier="kurikulum-item" identifierref="kurikulum-resource">
        <title>${title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="kurikulum-resource"
              type="webcontent"
              adlcp:scormtype="sco"
              href="index.html">
${fileEntries}
    </resource>
  </resources>
</manifest>`
}
