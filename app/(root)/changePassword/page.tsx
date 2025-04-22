"use client"
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmNewPassword) {
      alert('New passwords do not match.');
      return;
    }

    try {
      const token = localStorage.getItem("token"); // or however you're storing it

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/users/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      alert("Password changed successfully.");
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-10 p-6 rounded-lg shadow-lg bg-gradient-to-br from-orange-500 to-orange-600">
      <div className="flex items-center justify-center mb-6">
        <h2 className="text-2xl font-bold text-white">IPL Password Change</h2>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-inner">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-2 font-medium text-orange-700">Current Password</label>
            <Input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className="border-orange-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-orange-700">New Password</label>
            <Input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className="border-orange-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-orange-700">Confirm New Password</label>
            <Input
              type="password"
              name="confirmNewPassword"
              value={formData.confirmNewPassword}
              onChange={handleChange}
              required
              className="border-orange-300 focus:border-orange-500 focus:ring focus:ring-orange-200"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 mt-6"
          >
            Update Password
          </Button>
        </form>
      </div>

      <div className="mt-4 text-center">
        <p className="text-white text-sm">IPL Account Security • 2025</p>
      </div>
    </div>
  );
}
