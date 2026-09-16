import type { OrderStatus } from "./types";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  out_for_delivery: "En cours de livraison",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

export const STATUS_DESC: Record<OrderStatus, string> = {
  pending: "La boutique va confirmer votre commande.",
  confirmed: "La boutique a confirmé. Préparation en cours.",
  preparing: "Votre colis est en préparation.",
  shipped: "Le colis est parti chez le livreur.",
  out_for_delivery: "Le livreur est en route. Gardez le montant en espèces.",
  delivered: "Livrée. Merci !",
  cancelled: "Cette commande a été annulée.",
  returned: "Le colis a été retourné à la boutique.",
};

/** Happy path shown in the timeline. */
export const TIMELINE: OrderStatus[] = ["pending", "confirmed", "preparing", "shipped", "out_for_delivery", "delivered"];

export const isTerminalFailure = (s: OrderStatus) => s === "cancelled" || s === "returned";

export function statusTone(s: OrderStatus): { bg: string; fg: string } {
  if (s === "delivered") return { bg: "#E6F5EC", fg: "#0F7A3D" };
  if (isTerminalFailure(s)) return { bg: "#FDECEC", fg: "#B42323" };
  if (s === "pending") return { bg: "#FFF4D6", fg: "#8A5A00" };
  return { bg: "#EDE7F9", fg: "#5A31D6" };
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("fr-TN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
