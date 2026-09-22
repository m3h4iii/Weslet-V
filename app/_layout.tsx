import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { PrefsProvider } from "@/lib/prefs";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PrefsProvider>
        <CartProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" options={{ presentation: "card" }} />
            <Stack.Screen name="auth" options={{ presentation: "modal" }} />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="orders/index" />
            <Stack.Screen name="orders/[id]" />
            <Stack.Screen name="boutique/[id]" />
            <Stack.Screen name="favorites" />
            <Stack.Screen name="sizes" options={{ presentation: "modal" }} />
          </Stack>
        </CartProvider>
        </PrefsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
