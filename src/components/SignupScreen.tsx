import { useState } from "react";
import {
  Building2,
  User,
  Mail,
  CreditCard,
  Phone,
  Lock,
  Home as HomeIcon,
  MapPin,
} from "lucide-react";
import { toast } from 'sonner';
import { api } from '../services/api';

export default function SignupScreen({
  onNavigate,
}: {
  onNavigate: (screen: string) => void;
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    cnic: "",
    phone: "",
    propertyType: "house",
    ownership: "owner",
    // House specific
    block: "",
    street: "",
    houseNo: "",
    // Apartment specific
    plazaName: "",
    floorNumber: "",
    flatNumber: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.fullName || !formData.email || !formData.password || !formData.cnic) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Strict Email Validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|outlook\.com|yahoo\.com|hotmail\.com|icloud\.com)$/;
    if (!emailRegex.test(formData.email.toLowerCase())) {
      toast.error('Please use a valid email address (gmail.com, outlook.com, etc.)');
      return;
    }

    // Strict Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast.error('Password must be at least 8 chars, include uppercase, number, and special character');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!formData.agreeTerms) {
      toast.error('Please agree to terms');
      return;
    }

    setIsLoading(true);
    try {
      await api.auth.signup(formData);
      toast.success('Account created successfully!');
      onNavigate("login");
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-y-auto">
      {/* Top Section with Icon */}
      <div className="pt-12 pb-6 px-8 text-center sticky top-0 bg-gray-50 z-10">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md"
          style={{
            background:
              "linear-gradient(180deg, #003E2F 0%, #027A4C 100%)",
          }}
        >
          <Building2
            className="w-8 h-8 text-white"
            strokeWidth={1.5}
          />
        </div>
        <h2
          className="text-gray-900 mb-1"
          style={{ fontSize: "22px", fontWeight: 600 }}
        >
          Create Account
        </h2>
        <p
          className="text-gray-500"
          style={{ fontSize: "13px" }}
        >
          Join UrbanEase
        </p>
      </div>

      {/* Signup Form Card */}
      <div className="px-6 pb-8">
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fullName: e.target.value,
                    })
                  }
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                CNIC Number
              </label>
              <div className="relative">
                <CreditCard
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={formData.cnic}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cnic: e.target.value,
                    })
                  }
                  placeholder="XXXXX-XXXXXXX-X"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Phone Number
              </label>
              <div className="relative">
                <Phone
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+92 XXX XXXXXXX"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Property Type
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      propertyType: "house",
                    })
                  }
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.propertyType === "house"
                    ? "border-[#027A4C] bg-[#F1F8F4] text-[#027A4C]"
                    : "border-gray-200 text-gray-600"
                    }`}
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  House
                </button>
                <button
                  onClick={() =>
                    setFormData({
                      ...formData,
                      propertyType: "apartment",
                    })
                  }
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.propertyType === "apartment"
                    ? "border-[#027A4C] bg-[#F1F8F4] text-[#027A4C]"
                    : "border-gray-200 text-gray-600"
                    }`}
                  style={{ fontSize: "14px", fontWeight: 500 }}
                >
                  Apartment
                </button>
              </div>
            </div>

            {formData.propertyType === 'house' ? (
              <div className="space-y-4">
                {/* Ownership for House */}
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    Ownership
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ownership: "owner",
                        })
                      }
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.ownership === "owner"
                        ? "border-[#027A4C] bg-[#F1F8F4] text-[#027A4C]"
                        : "border-gray-200 text-gray-600"
                        }`}
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    >
                      Owner
                    </button>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ownership: "tenant",
                        })
                      }
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.ownership === "tenant"
                        ? "border-[#027A4C] bg-[#F1F8F4] text-[#027A4C]"
                        : "border-gray-200 text-gray-600"
                        }`}
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    >
                      Tenant
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      Block
                    </label>
                    <select
                      value={formData.block}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          block: e.target.value,
                        })
                      }
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C] bg-white"
                      style={{ fontSize: "14px" }}
                    >
                      <option value="">Block</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      Street
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          street: e.target.value,
                        })
                      }
                      placeholder="Street"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                      style={{ fontSize: "14px" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      House
                    </label>
                    <input
                      type="text"
                      value={formData.houseNo}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          houseNo: e.target.value,
                        })
                      }
                      placeholder="No."
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                      style={{ fontSize: "14px" }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Apartment Fields
              <div className="space-y-4">
                {/* Plaza Name */}
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    Plaza Name
                  </label>
                  <div className="relative">
                    <Building2
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                      strokeWidth={1.5}
                    />
                    <input
                      type="text"
                      value={formData.plazaName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plazaName: e.target.value,
                        })
                      }
                      placeholder="Enter plaza name"
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                      style={{ fontSize: "14px" }}
                    />
                  </div>
                </div>

                {/* Ownership */}
                <div>
                  <label
                    className="block text-gray-700 mb-2"
                    style={{ fontSize: "13px", fontWeight: 500 }}
                  >
                    Ownership
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ownership: "owner",
                        })
                      }
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.ownership === "owner"
                        ? "border-[#027A4C] bg-[#F1F8F4] text-[#027A4C]"
                        : "border-gray-200 text-gray-600"
                        }`}
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    >
                      Owner
                    </button>
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ownership: "tenant",
                        })
                      }
                      className={`flex-1 py-3 rounded-xl border-2 transition-all ${formData.ownership === "tenant"
                        ? "border-[#027A4C] bg-[#F1F8F4] text-[#027A4C]"
                        : "border-gray-200 text-gray-600"
                        }`}
                      style={{ fontSize: "14px", fontWeight: 500 }}
                    >
                      Tenant
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Floor Number */}
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      Floor Number
                    </label>
                    <input
                      type="text"
                      value={formData.floorNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          floorNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. 1st"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                      style={{ fontSize: "14px" }}
                    />
                  </div>
                  {/* Flat Number */}
                  <div>
                    <label
                      className="block text-gray-700 mb-2"
                      style={{ fontSize: "13px", fontWeight: 500 }}
                    >
                      Flat Number
                    </label>
                    <input
                      type="text"
                      value={formData.flatNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          flatNumber: e.target.value,
                        })
                      }
                      placeholder="e.g. A-1"
                      className="w-full px-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                      style={{ fontSize: "14px" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Create password"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-gray-700 mb-2"
                style={{ fontSize: "13px", fontWeight: 500 }}
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                  strokeWidth={1.5}
                />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#027A4C]/20 focus:border-[#027A4C]"
                  style={{ fontSize: "14px" }}
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.agreeTerms}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    agreeTerms: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-gray-300 text-[#027A4C] focus:ring-[#027A4C] mt-0.5"
              />
              <span
                className="text-gray-600"
                style={{ fontSize: "13px" }}
              >
                I agree to{" "}
                <span className="text-[#027A4C]">
                  Terms & Conditions
                </span>{" "}
                and{" "}
                <span className="text-[#027A4C]">
                  Privacy Policy
                </span>
              </span>
            </label>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(90deg, #003E2F 0%, #027A4C 100%)",
                fontSize: "16px",
                fontWeight: 500,
              }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </div>

        <p
          className="text-center mt-6 text-gray-600 pb-4"
          style={{ fontSize: "14px" }}
        >
          Already have an account?{" "}
          <button
            onClick={() => onNavigate("login")}
            className="text-[#027A4C]"
            style={{ fontWeight: 500 }}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}