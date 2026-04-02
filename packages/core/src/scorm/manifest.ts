export interface ManifestOptions {
  title: string
  identifier?: string
  files: string[]
  scormVersion?: 'scorm-1.2' | 'scorm-2004'
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
  const version = options.scormVersion ?? 'scorm-1.2'

  if (version === 'scorm-2004') {
    return generateScorm2004Manifest(options)
  }

  return generateScorm12Manifest(options)
}

function generateScorm12Manifest(options: ManifestOptions): string {
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

function generateScorm2004Manifest(options: ManifestOptions): string {
  const identifier = options.identifier ?? 'kurikulum-course'
  const title = escapeXml(options.title)
  const fileEntries = options.files
    .map(f => `      <file href="${escapeXml(f)}"/>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(identifier)}"
          version="1.0"
          xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
          xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
          xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
          xmlns:imsss="http://www.imsglobal.org/xsd/imsss">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
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
              adlcp:scormType="sco"
              href="index.html">
${fileEntries}
    </resource>
  </resources>
</manifest>`
}
