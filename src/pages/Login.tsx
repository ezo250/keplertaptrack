import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, GraduationCap, Loader2, Eye, EyeOff } from 'lucide-react';


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    setError('');
    
    const success = await login(email, password, selectedRole);
    
    if (success) {
      navigate(selectedRole === 'super_admin' ? '/admin' : '/teacher');
    } else {
      setError('Invalid credentials. Please check your email and password.');
    }
    
    setIsLoading(false);
  };

  const roleCards = [
    {
      role: 'super_admin' as UserRole,
      title: 'Super Admin',
      description: 'Full system control & management',
      icon: Shield,
      gradient: 'from-primary to-primary/80',
    },
    {
      role: 'teacher' as UserRole,
      title: 'Teacher',
      description: 'Pick up & return devices',
      icon: GraduationCap,
      gradient: 'from-secondary to-secondary/80',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile-First Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gradient-hero p-6 pb-8 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-white blur-2xl" />
            <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-white blur-2xl" />
          </div>
          
          <div className="relative z-10">
            <motion.img 
              src="/kepler-logo.png"
              alt="Kepler College"
              className="h-12 w-auto mx-auto mb-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            />
            <motion.h1 
              className="text-2xl font-heading font-bold text-white mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Kepler TapTrack
            </motion.h1>
            <motion.p 
              className="text-white/80 text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Smart device management for campus attendance
            </motion.p>
          </div>
        </motion.div>

        {/* Mobile Login Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-background flex-1"
        >
          <div className="max-w-sm mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-heading font-bold text-foreground mb-1 text-center">
                Welcome Back
              </h2>
              <p className="text-muted-foreground mb-6 text-center text-sm">
                Select your role and sign in
              </p>
            </motion.div>
            
            {/* Mobile Role Selection */}
            <div className="space-y-3 mb-6">
              {roleCards.map((card, index) => (
                <motion.button
                  key={card.role}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => setSelectedRole(card.role)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedRole === card.role 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-sm">{card.title}</h3>
                      <p className="text-xs text-muted-foreground">{card.description}</p>
                    </div>
                    {selectedRole === card.role && (
                      <motion.div
                        layoutId="mobileRoleIndicator"
                        className="w-2 h-2 rounded-full bg-primary"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
            
            {/* Mobile Login Form */}
            <AnimatePresence mode="wait">
              {selectedRole && (
                <motion.form
                  key="mobileLoginForm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="mobile-email" className="text-sm">Email Address</Label>
                    <Input
                      id="mobile-email"
                      type="email"
                      placeholder={selectedRole === 'super_admin' ? 'admin@kepler.edu' : 'teacher@kepler.edu'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobile-password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Input
                        id="mobile-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Mobile Footer */}
        <motion.div 
          className="p-6 pt-0 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-muted-foreground text-sm">Trusted by Kepler College</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kepler College. Developed by <span className="font-medium">Amani Alain</span>
          </p>
        </motion.div>
      </div>

      {/* Desktop Layout (unchanged) */}
      <div className="hidden lg:flex lg:flex-row min-h-screen">
        {/* Left Panel - Branding */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 gradient-hero p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-white blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <motion.img 
              src="/kepler-logo.png"
              alt="Kepler College"
              className="h-16 w-auto mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            />
          </div>
          
          <div className="relative z-10 text-white">
            <motion.h1 
              className="text-4xl lg:text-6xl font-heading font-bold mb-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Kepler TapTrack
            </motion.h1>
            <motion.p 
              className="text-xl lg:text-2xl text-white/80 max-w-md"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Smart device management for seamless campus attendance
            </motion.p>
            
            <motion.div 
              className="mt-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="text-white/70">Trusted by Kepler College</span>
              </div>
            </motion.div>
          </div>
          
          <motion.div 
            className="relative z-10 text-white/60 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <p>© {new Date().getFullYear()} Kepler College. All rights reserved.</p>
            <p className="mt-1">Developed by <span className="text-white/80 font-medium">Amani Alain</span></p>
          </motion.div>
        </motion.div>
        
        {/* Right Panel - Login Form */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 p-8 lg:p-16 flex items-center justify-center bg-background"
        >
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-heading font-bold text-foreground mb-2">
                Welcome Back
              </h2>
              <p className="text-muted-foreground mb-8">
                Select your role and sign in to continue
              </p>
            </motion.div>
            
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {roleCards.map((card, index) => (
                <motion.button
                  key={card.role}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => setSelectedRole(card.role)}
                  className={`relative p-6 rounded-xl border-2 transition-all duration-300 text-left group ${
                    selectedRole === card.role 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                  
                  {selectedRole === card.role && (
                    <motion.div
                      layoutId="roleIndicator"
                      className="absolute top-3 right-3 w-3 h-3 rounded-full bg-primary"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
            
            {/* Login Form */}
            <AnimatePresence mode="wait">
              {selectedRole && (
                <motion.form
                  key="loginForm"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={selectedRole === 'super_admin' ? 'admin@kepler.edu' : 'teacher@kepler.edu'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
