import {
  Cat, Bird, Fish, TreePalm, Waves, Martini, Bike, Compass, Anchor,
  Sun, Moon, Mountain, Flame, Crown, Diamond, Rocket, Zap, Star, Heart,
  Skull, Swords, Shield, Gem, Feather, Leaf, Flower2, Music, Gamepad2, Globe, Plane,
  type LucideIcon
} from "lucide-react";

// Icon name → component mapping (must match MyTrip.tsx AVATAR_ICONS)
const ICON_MAP: Record<string, LucideIcon> = {
  cat: Cat,
  bird: Bird,
  fish: Fish,
  palm: TreePalm,
  waves: Waves,
  martini: Martini,
  bike: Bike,
  compass: Compass,
  anchor: Anchor,
  sun: Sun,
  moon: Moon,
  mountain: Mountain,
  flame: Flame,
  crown: Crown,
  diamond: Diamond,
  rocket: Rocket,
  zap: Zap,
  star: Star,
  heart: Heart,
  skull: Skull,
  swords: Swords,
  shield: Shield,
  gem: Gem,
  feather: Feather,
  leaf: Leaf,
  flower: Flower2,
  music: Music,
  gamepad: Gamepad2,
  globe: Globe,
  plane: Plane,
};

interface MemberAvatarProps {
  avatarUrl?: string | null;
  avatarIcon?: string | null;
  avatarColor?: string | null;
  displayName: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: { container: "w-6 h-6", icon: "w-3 h-3", text: "text-[10px]" },
  sm: { container: "w-9 h-9", icon: "w-4 h-4", text: "text-sm" },
  md: { container: "w-12 h-12", icon: "w-6 h-6", text: "text-lg" },
  lg: { container: "w-20 h-20", icon: "w-9 h-9", text: "text-2xl" },
};

export default function MemberAvatar({
  avatarUrl,
  avatarIcon,
  avatarColor,
  displayName,
  size = "sm",
  className = "",
}: MemberAvatarProps) {
  const color = avatarColor || "#C9A84C";
  const s = SIZE_MAP[size];
  const IconComponent = avatarIcon ? ICON_MAP[avatarIcon] : null;

  return (
    <div
      className={`${s.container} rounded-full flex items-center justify-center overflow-hidden border shrink-0 ${className}`}
      style={{
        borderColor: color,
        backgroundColor: avatarUrl ? "transparent" : `${color}20`,
      }}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
      ) : IconComponent ? (
        <IconComponent className={s.icon} style={{ color }} strokeWidth={1.5} />
      ) : (
        <span className={`${s.text} font-bold`} style={{ color }}>
          {displayName?.charAt(0)?.toUpperCase() || "?"}
        </span>
      )}
    </div>
  );
}
