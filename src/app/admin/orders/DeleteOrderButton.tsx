"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { deleteOrderAction } from "./actions";

interface DeleteOrderButtonProps {
	orderId: string;
	customerName?: string;
	redirectAfterDelete?: boolean;
	variant?: "table" | "detail";
}

export default function DeleteOrderButton({
	orderId,
	customerName,
	redirectAfterDelete = false,
	variant = "table",
}: DeleteOrderButtonProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	const handleOpen = (e: React.MouseEvent) => {
		e.stopPropagation();
		setError(null);
		setIsOpen(true);
	};

	const handleClose = () => {
		if (isPending) return;
		setIsOpen(false);
		setError(null);
	};

	const handleConfirmDelete = () => {
		setError(null);
		startTransition(async () => {
			const res = await deleteOrderAction(orderId);
			if (res.success) {
				setIsOpen(false);
				if (redirectAfterDelete) {
					router.push("/admin/orders");
				} else {
					router.refresh();
				}
			} else {
				setError(res.error || "Failed to permanently delete the order.");
			}
		});
	};

	return (
		<>
			{variant === "table" ? (
				<button
					type="button"
					onClick={handleOpen}
					className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-[13px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-300"
					title={`Permanently delete order ${orderId}`}
				>
					<TrashIcon className="h-3.5 w-3.5" />
					<span>Delete</span>
				</button>
			) : (
				<button
					type="button"
					onClick={handleOpen}
					className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-[14px] font-semibold text-red-600 shadow-sm transition hover:bg-red-50 hover:border-red-300"
					title={`Permanently delete order ${orderId}`}
				>
					<TrashIcon className="h-4 w-4" />
					<span>Delete Order</span>
				</button>
			)}

			<Modal open={isOpen} onClose={handleClose} labelledBy="delete-order-modal-title" maxWidth="max-w-md">
				<div className="rounded-2xl border border-line bg-white p-6 shadow-xl text-left">
					<div className="flex items-start gap-3">
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
							<TrashIcon className="h-5 w-5" />
						</div>
						<div>
							<h2 id="delete-order-modal-title" className="text-[18px] font-extrabold text-ink">
								Permanently Delete Order?
							</h2>
							<p className="mt-1 text-[14px] text-ink-soft">
								Order <strong className="text-ink font-bold">{orderId}</strong>
								{customerName ? <span> for {customerName}</span> : null}
							</p>
						</div>
					</div>

					<div className="mt-4 rounded-xl border border-red-200 bg-red-50/70 p-3.5 text-[13.5px] leading-relaxed text-red-900">
						<p className="font-semibold text-red-950">Warning: Permanent deletion</p>
						<p className="mt-1">
							This will permanently remove this order and all related customer, item snapshot, and
							payment verification records from the website and database. No record will remain and this
							cannot be retrieved or undone.
						</p>
					</div>

					{error && (
						<div className="mt-3 rounded-lg border border-red-300 bg-red-100 p-2.5 text-[13px] font-medium text-red-800">
							{error}
						</div>
					)}

					<div className="mt-6 flex items-center justify-end gap-3">
						<button
							type="button"
							onClick={handleClose}
							disabled={isPending}
							className="rounded-lg border border-line bg-white px-4 py-2 text-[14px] font-semibold text-ink-soft transition hover:bg-row hover:text-ink disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleConfirmDelete}
							disabled={isPending}
							className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[14px] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60"
						>
							{isPending ? (
								<>
									<svg
										className="h-4 w-4 animate-spin text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										/>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										/>
									</svg>
									<span>Deleting...</span>
								</>
							) : (
								<span>Delete Permanently</span>
							)}
						</button>
					</div>
				</div>
			</Modal>
		</>
	);
}

function TrashIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.8}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
			/>
		</svg>
	);
}
