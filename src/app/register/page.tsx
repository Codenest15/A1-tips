'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaEye, FaEyeSlash, FaUser, FaLock, FaEnvelope, FaPhone, FaArrowRight } from 'react-icons/fa';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Check if password is strong enough
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Check if terms are agreed
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    // Check required fields
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        const requestBody = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone,
          is_superuser: false,
          is_staff: false
        };

        const response = await fetch('https://a1-tips-backend-main.onrender.com/auth/sign-up', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (response.ok) {
          alert('Account created successfully!');
          // Optionally reset form or redirect user
          setFormData({
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            agreeToTerms: false,
          });
        } else {
          const errorData = await response.json();
          alert(`Registration failed. ${errorData.detail || 'Please try again.'}`);
        }
      } catch (error) {
        console.error('Error during registration:', error);
        alert('Network error. Please check your connection and try again.');
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    // Clear confirm password error when password changes
    if (name === 'password' && errors.confirmPassword) {
      setErrors({
        ...errors,
        confirmPassword: ''
      });
    }
  };

    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">

      <div className="relative max-w-md w-full">
        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4">
              <span className="text-2xl font-bold text-white">A1</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">Join A1Tips and start winning today</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            {/* <div className="grid grid-cols-2 gap-4"> */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.username
                        ? 'border-red-500 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-green-100 focus:border-green-500'
                    }`}
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>
              {/* <div>
                <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className={`block w-full pl-12 pr-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 ${
                      errors.lastName 
                        ? 'border-red-500 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-green-100 focus:border-green-500'
                    }`}
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div> */}
            {/* </div> */}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 text-lg ${
                    errors.email 
                      ? 'border-red-500 focus:ring-red-100 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-green-100 focus:border-green-500'
                  }`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={`block w-full pl-12 pr-4 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 text-lg ${
                    errors.phone 
                      ? 'border-red-500 focus:ring-red-100 focus:border-red-500' 
                      : 'border-gray-200 focus:ring-green-100 focus:border-green-500'
                  }`}
                  placeholder="Phone Number (+233 XX XXX XXXX)"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`block w-full pl-12 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 text-lg ${
                      errors.password 
                        ? 'border-red-500 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-green-100 focus:border-green-500'
                    }`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className={`block w-full pl-12 pr-12 py-4 border-2 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 transition-all duration-200 text-lg ${
                      errors.confirmPassword 
                        ? 'border-red-500 focus:ring-red-100 focus:border-red-500' 
                        : 'border-gray-200 focus:ring-green-100 focus:border-green-500'
                    }`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="h-5 w-5" />
                    ) : (
                      <FaEye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  required
                  className={`h-4 w-4 focus:ring-2 border-gray-300 rounded ${
                    errors.agreeToTerms 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'text-green-600 focus:ring-green-500'
                  }`}
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="agreeToTerms" className="text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-green-600 hover:text-green-700 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>
            </div>
            {errors.agreeToTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
            )}

            {/* Register Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center px-6 py-4 border border-transparent rounded-xl text-lg font-bold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Create Account
              <FaArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>

          {/* Divider */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full px-6 py-4 border-2 border-green-500 rounded-xl text-lg font-bold text-green-600 hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-200"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Join thousands of successful bettors who trust A1Tips for their winning strategies.
          </p>
        </div>
      </div>
    </div>
  );
}