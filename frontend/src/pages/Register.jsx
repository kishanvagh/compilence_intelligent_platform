import React from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../components/Toast';

export const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { register: registerUser, isRegistering } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await registerUser(data);
      addToast('Registration successful! Please sign in.', 'success');
      navigate('/login');
    } catch (error) {
      addToast(error.response?.data?.message || 'Registration failed. Email might already be taken.', 'error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <ShieldCheck className="h-12 w-12 text-blue-600 mb-2" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Compliance Intelligence</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create an enterprise developer account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              {...register('name', { required: 'Full name is required' })}
              className={`w-full text-sm px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              }`}
              placeholder="John Doe"
            />
            {errors.name && (
              <span className="text-xs text-red-500 mt-1 block">{errors.name.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              {...register('email', { required: 'Email address is required' })}
              className={`w-full text-sm px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              }`}
              placeholder="auditor@enterprise.com"
            />
            {errors.email && (
              <span className="text-xs text-red-500 mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
              className={`w-full text-sm px-3 py-2 rounded border bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <span className="text-xs text-red-500 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded py-2 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors mt-6"
          >
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-100 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
