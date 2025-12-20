import { Building2 } from "lucide-react";

export default function WelcomeScreen({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  return (
    <div
      className="h-full flex flex-col items-center justify-center px-8"
      style={{
        background:
          "linear-gradient(180deg, #003E2F 0%, #005C3C 50%, #027A4C 100%)",
      }}
    >
      <div className="flex flex-col items-center mb-16">
        <div className="w-28 h-28 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-8 shadow-lg">
          <Building2
            className="w-14 h-14 text-white"
            strokeWidth={1.5}
          />
        </div>
        <h1
          className="text-white text-center mb-3"
          style={{ fontSize: "32px", fontWeight: 600 }}
        >
          UrbanEase
        </h1>
        <p
          className="text-white/80 text-center"
          style={{ fontSize: "15px" }}
        >
          Where Convenience meets Community
        </p>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={() => onNavigate("login")}
          className="w-full bg-white text-[#027A4C] py-4 rounded-xl transition-all hover:scale-[1.02] shadow-lg"
          style={{ fontSize: "16px", fontWeight: 500 }}
        >
          Login to Your Account
        </button>
        <button
          onClick={() => onNavigate("signup")}
          className="w-full bg-transparent text-white py-4 rounded-xl border-2 border-white/30 transition-all hover:scale-[1.02] backdrop-blur-sm"
          style={{ fontSize: "16px", fontWeight: 500 }}
        >
          Create New Account
        </button>
      </div>
    </div>
  );
}