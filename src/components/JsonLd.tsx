/**
 * Renders a JSON-LD structured-data block. Google + Bing read these to build
 * rich results (business info, FAQ dropdowns, breadcrumbs) — a major local-SEO
 * lever. One component, used for every schema type.
 */
export default function JsonLd({ data }: { data: object }) {
	return (
		<script
			type="application/ld+json"
			// Structured data is not user input — it's built from our own site config.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
