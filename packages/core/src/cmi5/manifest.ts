export interface Cmi5ManifestOptions {
  title: string
  identifier?: string
  activityId: string
  launchUrl?: string
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

export function generateCmi5Manifest(options: Cmi5ManifestOptions): string {
  const identifier = options.identifier ?? 'tabule-course'
  const title = escapeXml(options.title)
  const activityId = escapeXml(options.activityId)
  const launchUrl = escapeXml(options.launchUrl ?? 'index.html')

  return `<?xml version="1.0" encoding="UTF-8"?>
<courseStructure xmlns="https://w3id.org/xapi/profiles/cmi5/v1/CourseStructure.xsd">
  <course id="${activityId}">
    <title>
      <langstring lang="en-US">${title}</langstring>
    </title>
  </course>
  <au id="${escapeXml(identifier)}-au" launchUrl="${launchUrl}" moveOn="CompletedOrPassed">
    <title>
      <langstring lang="en-US">${title}</langstring>
    </title>
  </au>
</courseStructure>`
}
