export type TemplatePreset = {
  slug: string;
  name: string;
  category: "15anos" | "infantil" | "casamento";
  description: string;
  preview: string;
  defaultTitle: string;
  defaultDescription: string;
  theme: Record<string, any>;
  blocks: Array<Record<string, any>>;
};

const baseBlocks = (title: string, subtitle: string, accent: string) => [
  {
    id: "hero-1",
    type: "hero",
    order: 1,
    enabled: true,
    config: {
      label: "Convite Especial",
      title,
      subtitle,
      buttonText: "Ver Lista de Presentes",
      backgroundImage: "",
      backgroundColor: accent,
    },
  },
  {
    id: "message-1",
    type: "message",
    order: 2,
    enabled: true,
    config: {
      title: "Nossa Historia",
      message:
        "Sua presenca e muito importante. Se quiser nos presentear, montamos esta lista com carinho.",
      signature: "Com amor",
    },
  },
  {
    id: "gifts-1",
    type: "gifts",
    order: 3,
    enabled: true,
    config: {
      title: "Lista de Presentes",
      layout: "grid",
    },
  },
  {
    id: "messages-1",
    type: "messages",
    order: 4,
    enabled: true,
    config: {
      title: "Mural de Recados",
      showPublicly: true,
    },
  },
];

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    slug: "15-anos-glam",
    name: "15 Anos Glam",
    category: "15anos",
    description: "Luxo com dourado, foto em destaque e visual elegante.",
    preview: "linear-gradient(135deg,#2b1b15,#c89f65)",
    defaultTitle: "15 anos da Debutante",
    defaultDescription: "Uma noite inesquecivel",
    theme: {
      primary_color: "#C89F65",
      secondary_color: "#2B1B15",
      background_color: "#FAF4EF",
      font_title: "Playfair Display",
      font_body: "Inter",
    },
    blocks: baseBlocks("15 anos da Debutante", "Uma noite inesquecivel", "#2B1B15"),
  },
  {
    slug: "15-anos-floral",
    name: "15 Anos Floral",
    category: "15anos",
    description: "Tema leve e romantico, tons rosados e atmosfera delicada.",
    preview: "linear-gradient(135deg,#c65a3a,#f0b7a4)",
    defaultTitle: "Minha Festa de 15",
    defaultDescription: "Vamos celebrar juntos",
    theme: {
      primary_color: "#C65A3A",
      secondary_color: "#F0B7A4",
      background_color: "#FFF4EF",
      font_title: "Cormorant Garamond",
      font_body: "Inter",
    },
    blocks: baseBlocks("Minha Festa de 15", "Vamos celebrar juntos", "#C65A3A"),
  },
  {
    slug: "15-anos-neon",
    name: "15 Anos Neon",
    category: "15anos",
    description: "Visual jovem com contraste forte e energia de balada.",
    preview: "linear-gradient(135deg,#2a1238,#7a39a8)",
    defaultTitle: "Night Party 15",
    defaultDescription: "Dress code: brilho total",
    theme: {
      primary_color: "#7A39A8",
      secondary_color: "#2A1238",
      background_color: "#F7F0FB",
      font_title: "Montserrat",
      font_body: "Inter",
    },
    blocks: baseBlocks("Night Party 15", "Dress code: brilho total", "#2A1238"),
  },
  {
    slug: "aniversario-infantil",
    name: "Aniversario Infantil",
    category: "infantil",
    description: "Colorido, divertido e alegre para festas infantis.",
    preview: "linear-gradient(135deg,#ff8a00,#ffd43b)",
    defaultTitle: "Aniversario do Pequeno",
    defaultDescription: "Vamos brincar e comemorar",
    theme: {
      primary_color: "#FF8A00",
      secondary_color: "#FFD43B",
      background_color: "#FFF9EC",
      font_title: "Poppins",
      font_body: "Inter",
    },
    blocks: baseBlocks("Aniversario do Pequeno", "Vamos brincar e comemorar", "#FF8A00"),
  },
  {
    slug: "casamento-classico",
    name: "Casamento Classico",
    category: "casamento",
    description: "Estilo refinado para casamento tradicional.",
    preview: "linear-gradient(135deg,#8e3d2c,#c65a3a)",
    defaultTitle: "Nosso Casamento",
    defaultDescription: "Celebre esse momento conosco",
    theme: {
      primary_color: "#8E3D2C",
      secondary_color: "#C65A3A",
      background_color: "#FAF4EF",
      font_title: "Playfair Display",
      font_body: "Inter",
    },
    blocks: baseBlocks("Nosso Casamento", "Celebre esse momento conosco", "#8E3D2C"),
  },
];

export function getTemplatePresetBySlug(slug?: string | null) {
  if (!slug) return null;
  return TEMPLATE_PRESETS.find((item) => item.slug === slug) ?? null;
}
