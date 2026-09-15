export const colors = {
  white: "#FFFFFF",
  ink: "#17121F",
  muted: "#6E6678",
  line: "#E9E4EE",
  mist: "#F4F1F8",
  violet: "#6C3CFF",
  pink: "#FF3D8A",
  amber: "#FFB020",
};

export const gradient = [colors.violet, colors.pink, colors.amber] as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const formatPrice = (dt: number) => `${dt.toLocaleString("fr-TN")} DT`;
