import { requireAdmin } from "@/lib/admin-auth";
import { listSiteImages } from "@/lib/catalog";
import { type SiteImage, type SiteImageGroup } from "@/lib/catalog-types";
import PhotoPicker from "../PhotoPicker";
import {
	saveLogoAction,
	addPhotoAction,
	deletePhotoAction,
	savePhotoCaptionAction,
	movePhotoAction,
} from "./actions";
import { aCard, aCardTitle, aCardSub, aPageTitle, aInput } from "@/lib/admin-ui";
import { SaveButton } from "../SaveButton";

export const dynamic = "force-dynamic";

export default async function AdminPhotos() {
	await requireAdmin();
	const [logo, about, banners] = await Promise.all([
		listSiteImages("logo"),
		listSiteImages("about"),
		listSiteImages("banner"),
	]);

	return (
		<div>
			<h1 className={aPageTitle}>Photos</h1>
			<p className="mb-6 mt-1 text-[15px] text-muted">
				Your own pictures. Pick a photo and it goes live on the website by itself — there is
				nothing else to press. Photos of your <b>products</b> go in the{" "}
				<b>Products</b> tab, next to each item.
			</p>

			{/* ---- logo ---- */}
			<div className={`mb-6 ${aCard}`}>
				<h2 className={aCardTitle}>🏪 Shop logo</h2>
				<p className={aCardSub}>
					Shown at the top of every page and in the footer. Best with a wide picture on a plain
					background. Leave it empty to keep the Standard Fireworks logo that is there now.
				</p>
				<form action={saveLogoAction}>
					<input type="hidden" name="group" value="logo" />
					<PhotoPicker
						alt="shop logo"
						current={logo[0]?.url ?? ""}
						addLabel={"+ Add\nlogo"}
						size={104}
						maxDim={500}
					/>
				</form>
			</div>

			{/* ---- about ---- */}
			<PhotoGroup
				group="about"
				title="🏬 Shop & godown photos"
				sub="These appear on the About Us page. Pictures of the shop, the godown, your team, packed orders — anything that shows customers you are real. The first one is the big photo next to your story."
				images={about}
			/>

			{/* ---- banners ---- */}
			<PhotoGroup
				group="banner"
				title="🎆 Home page banners"
				sub="Wide pictures shown across the home page, just under the top banner. Good for a Deepavali offer picture, a shop photo or a gift-box picture. Landscape pictures work best."
				images={banners}
			/>

			<p className="text-[13.5px] leading-6 text-muted">
				<b className="text-ink-soft">Please use your own photos.</b>{" "}
				Pictures copied from other
				shops&apos; or brands&apos; websites belong to them, and using them on a shop website can
				get you a copyright notice. Photos taken on your phone are perfect.
			</p>
		</div>
	);
}

function PhotoGroup({
	group,
	title,
	sub,
	images,
}: {
	group: SiteImageGroup;
	title: string;
	sub: string;
	images: SiteImage[];
}) {
	return (
		<div className={`mb-6 ${aCard}`}>
			<h2 className={aCardTitle}>{title}</h2>
			<p className={aCardSub}>{sub}</p>

			{images.length > 0 && (
				<div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{images.map((img, i) => (
						<div key={img.id} className="rounded-xl border border-line bg-row p-3">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={img.url}
								alt={img.caption || "uploaded photo"}
								className="mb-2.5 h-40 w-full rounded-lg border border-line bg-white object-cover"
							/>
							<form action={savePhotoCaptionAction} className="flex items-center gap-2">
								<input type="hidden" name="id" value={img.id} />
								<input
									name="caption"
									defaultValue={img.caption}
									placeholder="Caption (optional)"
									className={`${aInput} mt-0! py-2! text-[14px]!`}
								/>
								<SaveButton
									label="Save"
									pendingLabel="Saving..."
									savedLabel="Saved ✓"
									className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] font-semibold text-ink hover:bg-shell shrink-0"
								/>
							</form>
							<div className="mt-2 flex items-center gap-1.5">
								<MoveBtn id={img.id} dir="up" disabled={i === 0} label="◀ Earlier" />
								<MoveBtn id={img.id} dir="down" disabled={i === images.length - 1} label="Later ▶" />
								<form action={deletePhotoAction} className="ml-auto">
									<input type="hidden" name="id" value={img.id} />
									<button className="rounded-lg border border-red-300 px-3 py-2 text-[14px] font-semibold text-red-600 hover:bg-red-50">
										Delete
									</button>
								</form>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Remounts after every add (key), which clears the picker for the next photo. */}
			<form action={addPhotoAction} key={images.length}>
				<input type="hidden" name="group" value={group} />
				<PhotoPicker
					alt={title}
					current=""
					addLabel={"+ Add\nphoto"}
					size={104}
					maxDim={1400}
					showRemove={false}
				/>
			</form>
			{images.length === 0 && (
				<p className="mt-2 text-[13.5px] text-muted">No pictures yet — the page works fine without them.</p>
			)}
		</div>
	);
}

function MoveBtn({
	id,
	dir,
	disabled,
	label,
}: {
	id: string;
	dir: "up" | "down";
	disabled: boolean;
	label: string;
}) {
	return (
		<form action={movePhotoAction}>
			<input type="hidden" name="id" value={id} />
			<input type="hidden" name="dir" value={dir} />
			<button
				disabled={disabled}
				className="rounded-lg border border-line bg-white px-3 py-2 text-[14px] font-semibold text-ink-soft hover:bg-shell disabled:cursor-not-allowed disabled:opacity-40"
			>
				{label}
			</button>
		</form>
	);
}
