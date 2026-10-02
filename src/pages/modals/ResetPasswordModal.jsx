// src/pages/modals/ResetPasswordModal.jsx
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import employeeAPI from '../../apis/employeeAPI';
import { toast } from 'sonner';
import { 
  Key, 
  X, 
  Eye, 
  EyeOff, 
  Shuffle, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  User
} from 'lucide-react';

const ResetPasswordModal = ({ isOpen, onClose, employee, onPasswordReset }) => {
  const { themeColors } = useTheme();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !employee) return null;

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$!';
    let pass = '';
    // Ensure at least one uppercase, lowercase, number, symbol
    pass += 'A' + Math.floor(Math.random() * 9 + 1);
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    pass += '@' + Math.floor(Math.random() * 90 + 10);
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowPassword(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.trim().length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);
      const response = await employeeAPI.resetPassword(employee._id, newPassword.trim());
      
      toast.success(response.data?.message || 'Password reset successfully!');
      
      if (onPasswordReset) {
        onPasswordReset(employee._id, newPassword.trim());
      }

      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={handleClose}
    >
      <div 
        className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border"
        style={{ 
          backgroundColor: themeColors.surface, 
          borderColor: themeColors.border,
          color: themeColors.text
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="p-5 border-b flex items-center justify-between"
          style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}
        >
          <div className="flex items-center gap-2.5">
            <div 
              className="p-2 rounded-xl"
              style={{ backgroundColor: themeColors.primary + '20', color: themeColors.primary }}
            >
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold">Reset Employee Password</h2>
              <p className="text-xs opacity-60">Set a new login password for this employee</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:opacity-75 transition-opacity"
            style={{ backgroundColor: themeColors.surface }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Employee Info Card */}
        <div className="p-5 space-y-4">
          <div 
            className="p-3.5 rounded-xl border flex items-center justify-between text-xs"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
          >
            <div className="flex items-center gap-2.5">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white uppercase text-xs"
                style={{ backgroundColor: themeColors.primary }}
              >
                {employee.name?.first?.[0] || 'E'}{employee.name?.last?.[0] || ''}
              </div>
              <div>
                <p className="font-bold text-sm">{employee.name?.first} {employee.name?.last}</p>
                <p className="opacity-60">{employee.email}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-semibold px-2 py-0.5 rounded-md text-[11px]" style={{ backgroundColor: themeColors.primary + '15', color: themeColors.primary }}>
                {employee.employeeId || 'No ID'}
              </span>
              <p className="text-[11px] opacity-60 mt-0.5">{employee.role}</p>
            </div>
          </div>

          {error && (
            <div 
              className="p-3 rounded-xl border flex items-center gap-2 text-xs"
              style={{ 
                backgroundColor: themeColors.danger + '15', 
                borderColor: themeColors.danger + '40', 
                color: themeColors.danger 
              }}
            >
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* New Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold">New Password *</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="flex items-center gap-1 text-[11px] font-semibold transition-all hover:underline"
                  style={{ color: themeColors.primary }}
                >
                  <Shuffle size={12} /> Generate Random
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  style={{ 
                    backgroundColor: themeColors.background, 
                    borderColor: themeColors.border, 
                    color: themeColors.text 
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-semibold mb-1.5">Confirm Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                  style={{ 
                    backgroundColor: themeColors.background, 
                    borderColor: themeColors.border, 
                    color: themeColors.text 
                  }}
                />
              </div>
            </div>

            {/* Password Hint */}
            {newPassword && (
              <div className="p-2.5 rounded-lg text-[11px] flex items-center gap-1.5 opacity-80" style={{ backgroundColor: themeColors.background }}>
                <CheckCircle2 size={13} className={newPassword.length >= 6 ? 'text-green-500' : 'text-gray-400'} />
                <span>Length: {newPassword.length} chars (minimum 6 required)</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !newPassword || newPassword.length < 6}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                style={{ backgroundColor: themeColors.primary }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Lock size={13} /> Reset Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
