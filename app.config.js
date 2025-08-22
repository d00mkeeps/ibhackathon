const config = {
expo: {
name: "Volc",
slug: "Volc",
version: "1.0.0",
orientation: "portrait",
icon: "./assets/images/icon.png",
scheme: "myapp",
userInterfaceStyle: "automatic",
splash: {
image: "./assets/images/splash.png",
resizeMode: "contain",
backgroundColor: "#ffffff"
 },
ios: {
supportsTablet: true,
bundleIdentifier: "com.d00mkeeps.trainsmart",
minimumOSVersion: "15.1" 
 },
android: {
adaptiveIcon: {
foregroundImage: "./assets/images/adaptive-icon.png",
backgroundColor: "#ffffff"
 },
package: "com.d00mkeeps.trainsmart",
minSdkVersion: 24,       
compileSdkVersion: 35 
 },
web: {
bundler: "metro",
output: "static",
favicon: "./assets/images/favicon.png"
 },
plugins: [
"expo-router",
    "expo-font",
    "expo-web-browser"
 ],
experiments: {
typedRoutes: true
 },
extra: {
router: {
origin: false
 },
eas: {
projectId: "5e8c9085-5d3d-4a87-a841-3e1b55340ff8"
 },
apiUrl: process.env.API_URL || "https://localhost:8000",
 },
jsEngine: "hermes",
newArchEnabled: true,
 }
}
export default config