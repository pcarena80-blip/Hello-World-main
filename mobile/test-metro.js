try {
    const nw = require("nativewind/metro");
    console.log("NativeWind/Metro loaded:", nw);
    const { getDefaultConfig } = require("expo/metro-config");
    const config = getDefaultConfig(__dirname);
    console.log("Expo config loaded");
} catch (e) {
    console.error("Error loading modules:", e);
}
