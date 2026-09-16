import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Address } from "./types";

export const GOVERNORATES = [
  "Tunis", "Ariana", "Ben Arous", "Manouba", "Nabeul", "Zaghouan", "Bizerte", "Béja",
  "Jendouba", "Le Kef", "Siliana", "Sousse", "Monastir", "Mahdia", "Sfax", "Kairouan",
  "Kasserine", "Sidi Bouzid", "Gabès", "Médenine", "Tataouine", "Gafsa", "Tozeur", "Kébili",
];

export const DELIVERY_FEE = 7; // dinars, per boutique shipment (matches place_order)

export const emptyAddress: Address = {
  recipientName: "", phone: "", governorate: "", city: "", addressLine: "", notes: "",
};

const KEY = "weslet.address.v1";

export async function loadAddress(): Promise<Address | null> {
  try {
    const s = await AsyncStorage.getItem(KEY);
    return s ? { ...emptyAddress, ...JSON.parse(s) } : null;
  } catch { return null; }
}

export async function saveAddress(a: Address) {
  try { await AsyncStorage.setItem(KEY, JSON.stringify(a)); } catch {}
}

// Tunisian mobile/landline: 8 digits, optional +216
export function normalizePhone(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const local = d.startsWith("216") && d.length === 11 ? d.slice(3) : d;
  return local.length === 8 ? local : null;
}

export function validateAddress(a: Address): string | null {
  if (a.recipientName.trim().length < 2) return "Indiquez le nom du destinataire.";
  if (!normalizePhone(a.phone)) return "Numéro de téléphone invalide (8 chiffres).";
  if (!a.governorate) return "Choisissez un gouvernorat.";
  if (a.city.trim().length < 2) return "Indiquez la ville.";
  if (a.addressLine.trim().length < 5) return "Indiquez l'adresse complète.";
  return null;
}
