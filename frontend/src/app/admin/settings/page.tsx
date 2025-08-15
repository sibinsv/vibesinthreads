'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Settings, 
  Globe, 
  Mail, 
  Palette, 
  Shield,
  Package,
  CreditCard,
  Bell,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

interface StoreSettings {
  // General
  storeName: string;
  storeDescription: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  storeLogo: string;
  
  // Currency & Region
  currency: string;
  timezone: string;
  language: string;
  
  // Email
  emailFrom: string;
  emailHost: string;
  emailPort: string;
  emailUser: string;
  emailPass: string;
  emailEncryption: string;
  
  // Shipping
  freeShippingThreshold: number;
  defaultShippingCost: number;
  
  // Taxes
  enableTax: boolean;
  taxRate: number;
  taxIncluded: boolean;
  
  // SEO
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  
  // Social Media
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  
  // Features
  enableWishlist: boolean;
  enableCompareProducts: boolean;
  enableGuestCheckout: boolean;
  
  // Notifications
  orderNotifications: boolean;
  lowStockNotifications: boolean;
  newCustomerNotifications: boolean;
}

export default function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState<StoreSettings>({
    // General
    storeName: 'Vibes in Threads',
    storeDescription: 'Premium traditional Indian clothing and fashion accessories',
    storeEmail: 'hello@vibesinthreads.com',
    storePhone: '+91 98765 43210',
    storeAddress: 'Mumbai, Maharashtra, India',
    storeLogo: '',
    
    // Currency & Region
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    language: 'en',
    
    // Email
    emailFrom: 'noreply@vibesinthreads.com',
    emailHost: 'smtp.gmail.com',
    emailPort: '587',
    emailUser: '',
    emailPass: '',
    emailEncryption: 'tls',
    
    // Shipping
    freeShippingThreshold: 2000,
    defaultShippingCost: 100,
    
    // Taxes
    enableTax: true,
    taxRate: 18,
    taxIncluded: false,
    
    // SEO
    metaTitle: 'Vibes in Threads - Premium Indian Fashion',
    metaDescription: 'Discover premium traditional Indian clothing, sarees, kurtas, and fashion accessories at Vibes in Threads.',
    metaKeywords: 'indian fashion, saree, kurta, traditional clothing, ethnic wear',
    
    // Social Media
    facebookUrl: '',
    instagramUrl: '',
    twitterUrl: '',
    youtubeUrl: '',
    
    // Features
    enableWishlist: true,
    enableCompareProducts: true,
    enableGuestCheckout: true,
    
    // Notifications
    orderNotifications: true,
    lowStockNotifications: true,
    newCustomerNotifications: true
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: keyof StoreSettings, value: string | number | boolean) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock API call
      console.log('Saving settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'regional', label: 'Regional', icon: Globe },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'shipping', label: 'Shipping & Tax', icon: Package },
    { id: 'seo', label: 'SEO', icon: Palette },
    { id: 'features', label: 'Features', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure your store settings and preferences</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Store Name
                    </label>
                    <input
                      type="text"
                      value={settings.storeName}
                      onChange={(e) => handleInputChange('storeName', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Store Email
                    </label>
                    <input
                      type="email"
                      value={settings.storeEmail}
                      onChange={(e) => handleInputChange('storeEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={settings.storePhone}
                      onChange={(e) => handleInputChange('storePhone', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Store Address
                    </label>
                    <input
                      type="text"
                      value={settings.storeAddress}
                      onChange={(e) => handleInputChange('storeAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Store Description
                  </label>
                  <textarea
                    value={settings.storeDescription}
                    onChange={(e) => handleInputChange('storeDescription', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Store Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.storeLogo}
                    onChange={(e) => handleInputChange('storeLogo', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  />
                </div>
              </div>
            )}

            {/* Regional Settings */}
            {activeTab === 'regional' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Regional Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Currency
                    </label>
                    <select
                      value={settings.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="INR">₹ Indian Rupee (INR)</option>
                      <option value="USD">$ US Dollar (USD)</option>
                      <option value="EUR">€ Euro (EUR)</option>
                      <option value="GBP">£ British Pound (GBP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Timezone
                    </label>
                    <select
                      value={settings.timezone}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Language
                    </label>
                    <select
                      value={settings.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="mr">Marathi</option>
                      <option value="gu">Gujarati</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Email Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      From Email
                    </label>
                    <input
                      type="email"
                      value={settings.emailFrom}
                      onChange={(e) => handleInputChange('emailFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SMTP Host
                    </label>
                    <input
                      type="text"
                      value={settings.emailHost}
                      onChange={(e) => handleInputChange('emailHost', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.emailPort}
                      onChange={(e) => handleInputChange('emailPort', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Encryption
                    </label>
                    <select
                      value={settings.emailEncryption}
                      onChange={(e) => handleInputChange('emailEncryption', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    >
                      <option value="tls">TLS</option>
                      <option value="ssl">SSL</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SMTP Username
                    </label>
                    <input
                      type="text"
                      value={settings.emailUser}
                      onChange={(e) => handleInputChange('emailUser', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      SMTP Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={settings.emailPass}
                        onChange={(e) => handleInputChange('emailPass', e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping & Tax Settings */}
            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Shipping & Tax Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-medium text-foreground mb-4">Shipping</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Free Shipping Threshold (₹)
                        </label>
                        <input
                          type="number"
                          value={settings.freeShippingThreshold}
                          onChange={(e) => handleInputChange('freeShippingThreshold', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Default Shipping Cost (₹)
                        </label>
                        <input
                          type="number"
                          value={settings.defaultShippingCost}
                          onChange={(e) => handleInputChange('defaultShippingCost', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-foreground mb-4">Tax Settings</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="enableTax"
                          checked={settings.enableTax}
                          onChange={(e) => handleInputChange('enableTax', e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="enableTax" className="text-sm font-medium text-foreground">
                          Enable Tax Calculation
                        </label>
                      </div>
                      
                      {settings.enableTax && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-6">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              Tax Rate (%)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={settings.taxRate}
                              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                            />
                          </div>
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="taxIncluded"
                              checked={settings.taxIncluded}
                              onChange={(e) => handleInputChange('taxIncluded', e.target.checked)}
                              className="rounded border-border text-primary focus:ring-primary mr-2"
                            />
                            <label htmlFor="taxIncluded" className="text-sm font-medium text-foreground">
                              Tax Included in Prices
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEO Settings */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">SEO Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meta Title
                    </label>
                    <input
                      type="text"
                      value={settings.metaTitle}
                      onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {settings.metaTitle.length}/60 characters (recommended)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={settings.metaDescription}
                      onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {settings.metaDescription.length}/160 characters (recommended)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Meta Keywords
                    </label>
                    <input
                      type="text"
                      value={settings.metaKeywords}
                      onChange={(e) => handleInputChange('metaKeywords', e.target.value)}
                      placeholder="keyword1, keyword2, keyword3"
                      className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                    />
                  </div>

                  <div>
                    <h3 className="text-md font-medium text-foreground mb-4">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Facebook URL
                        </label>
                        <input
                          type="url"
                          value={settings.facebookUrl}
                          onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                          placeholder="https://facebook.com/yourpage"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Instagram URL
                        </label>
                        <input
                          type="url"
                          value={settings.instagramUrl}
                          onChange={(e) => handleInputChange('instagramUrl', e.target.value)}
                          placeholder="https://instagram.com/yourprofile"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Twitter URL
                        </label>
                        <input
                          type="url"
                          value={settings.twitterUrl}
                          onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                          placeholder="https://twitter.com/yourhandle"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          YouTube URL
                        </label>
                        <input
                          type="url"
                          value={settings.youtubeUrl}
                          onChange={(e) => handleInputChange('youtubeUrl', e.target.value)}
                          placeholder="https://youtube.com/yourchannel"
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Features Settings */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Feature Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableWishlist"
                      checked={settings.enableWishlist}
                      onChange={(e) => handleInputChange('enableWishlist', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="enableWishlist" className="text-sm font-medium text-foreground">
                        Enable Wishlist
                      </label>
                      <p className="text-xs text-muted-foreground">Allow customers to save products for later</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableCompareProducts"
                      checked={settings.enableCompareProducts}
                      onChange={(e) => handleInputChange('enableCompareProducts', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="enableCompareProducts" className="text-sm font-medium text-foreground">
                        Enable Product Comparison
                      </label>
                      <p className="text-xs text-muted-foreground">Allow customers to compare multiple products</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enableGuestCheckout"
                      checked={settings.enableGuestCheckout}
                      onChange={(e) => handleInputChange('enableGuestCheckout', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="enableGuestCheckout" className="text-sm font-medium text-foreground">
                        Enable Guest Checkout
                      </label>
                      <p className="text-xs text-muted-foreground">Allow customers to checkout without creating an account</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-foreground">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="orderNotifications"
                      checked={settings.orderNotifications}
                      onChange={(e) => handleInputChange('orderNotifications', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="orderNotifications" className="text-sm font-medium text-foreground">
                        Order Notifications
                      </label>
                      <p className="text-xs text-muted-foreground">Get notified when new orders are placed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="lowStockNotifications"
                      checked={settings.lowStockNotifications}
                      onChange={(e) => handleInputChange('lowStockNotifications', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="lowStockNotifications" className="text-sm font-medium text-foreground">
                        Low Stock Notifications
                      </label>
                      <p className="text-xs text-muted-foreground">Get notified when products are running low on stock</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="newCustomerNotifications"
                      checked={settings.newCustomerNotifications}
                      onChange={(e) => handleInputChange('newCustomerNotifications', e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <div>
                      <label htmlFor="newCustomerNotifications" className="text-sm font-medium text-foreground">
                        New Customer Notifications
                      </label>
                      <p className="text-xs text-muted-foreground">Get notified when new customers register</p>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="pt-6 border-t border-border">
              <div className="flex justify-end">
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}