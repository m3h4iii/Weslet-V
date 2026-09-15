import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/lib/theme";
import { useCart } from "@/lib/cart";

function Icon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, color: focused ? colors.ink : colors.muted }}>{glyph}</Text>;
}

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.line, height: 64 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Pour vous", tabBarIcon: ({ focused }) => <Icon glyph="⌂" focused={focused} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Explorer", tabBarIcon: ({ focused }) => <Icon glyph="⌕" focused={focused} /> }} />
      <Tabs.Screen
        name="bag"
        options={{
          title: "Panier",
          tabBarIcon: ({ focused }) => <Icon glyph="◫" focused={focused} />,
          tabBarBadge: count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.pink, color: "#fff", fontSize: 11 },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profil", tabBarIcon: ({ focused }) => <Icon glyph="◯" focused={focused} /> }} />
    </Tabs>
  );
}
