/**
 * Admin page to manage linked creators
 * 
 * Features:
 * - View all linked creators
 * - Add new creators (single or bulk)
 * - Remove creators
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Plus, Trash2, Upload, Loader2, 
  CheckCircle, AlertCircle, X, UserPlus
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { isAdminEmail } from '../lib/isAdmin';

interface LinkedCreator {
  id: string;
  tiktok_handle: string;
  display_name: string | null;
  notes: string | null;
  status: string;
  linked_at: string;
}

const AdminLinkedCreators: React.FC = () => {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  
  // State
  const [creators, setCreators] = useState<LinkedCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkHandles, setBulkHandles] = useState('');
  const [adding, setAdding] = useState(false);
  
  // Check admin
  const isAdmin = isAdminEmail(user?.email);
  
  // Fetch creators
  const fetchCreators = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch('/api/admin/linked-creators', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCreators(data.creators || []);
      } else {
        const err = await response.json();
        setError(err.error || 'Failed to load creators');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load creators');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (session) {
      fetchCreators();
    }
  }, [session]);
  
  // Add creator(s)
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) return;
    
    setAdding(true);
    setError(null);
    setSuccess(null);
    
    try {
      let body: any;
      
      if (bulkMode) {
        // Parse bulk handles (comma, newline, or space separated)
        const handles = bulkHandles
          .split(/[\n,\s]+/)
          .map(h => h.trim().replace(/^@/, ''))
          .filter(h => h.length >= 2);
        
        if (handles.length === 0) {
          setError('No valid handles found');
          setAdding(false);
          return;
        }
        
        body = {
          creators: handles.map(h => ({ handle: h })),
        };
      } else {
        if (!newHandle.trim()) {
          setError('Handle is required');
          setAdding(false);
          return;
        }
        
        body = {
          handle: newHandle.trim(),
          displayName: newDisplayName.trim() || undefined,
          notes: newNotes.trim() || undefined,
        };
      }
      
      const response = await fetch('/api/admin/linked-creators', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Added ${data.added} creator(s)`);
        setShowAddForm(false);
        setNewHandle('');
        setNewDisplayName('');
        setNewNotes('');
        setBulkHandles('');
        fetchCreators();
      } else {
        setError(data.error || 'Failed to add');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add');
    } finally {
      setAdding(false);
    }
  };
  
  // Remove creator
  const handleRemove = async (handle: string) => {
    if (!session?.access_token) return;
    if (!confirm(`Remove @${handle} from linked creators?`)) return;
    
    try {
      const response = await fetch(`/api/admin/linked-creators?handle=${handle}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        setSuccess(`Removed @${handle}`);
        fetchCreators();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove');
    }
  };
  
  // Not admin - redirect
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-titan-bg flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text-primary mb-2">Access Denied</h1>
          <p className="text-text-muted">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-titan-bg pb-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-accent-teal to-accent-fuchsia rounded-lg flex items-center justify-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-text-primary">
                  Linked Creators
                </h1>
                <p className="text-sm text-text-muted">
                  Manage creators linked to Titans agency ({creators.length} total)
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors"
            >
              <UserPlus size={16} />
              Add Creator
            </button>
          </div>
        </div>
        
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
              <X size={16} />
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 rounded-lg bg-accent-teal/10 border border-accent-teal/30 flex items-center gap-3">
            <CheckCircle size={20} className="text-accent-teal" />
            <span className="text-sm text-accent-teal">{success}</span>
            <button onClick={() => setSuccess(null)} className="ml-auto text-accent-teal hover:text-accent-teal/80">
              <X size={16} />
            </button>
          </div>
        )}
        
        {/* Add Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-titan-surface border border-titan-border rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-titan-border">
                <h2 className="text-lg font-semibold text-text-primary">
                  Add Linked Creator
                </h2>
                <button onClick={() => setShowAddForm(false)} className="text-text-muted hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleAdd} className="p-6">
                {/* Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setBulkMode(false)}
                    className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                      !bulkMode 
                        ? 'bg-accent-teal text-white' 
                        : 'bg-titan-elevated text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Single
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkMode(true)}
                    className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                      bulkMode 
                        ? 'bg-accent-teal text-white' 
                        : 'bg-titan-elevated text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Bulk Import
                  </button>
                </div>
                
                {bulkMode ? (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      TikTok Handles (one per line)
                    </label>
                    <textarea
                      value={bulkHandles}
                      onChange={(e) => setBulkHandles(e.target.value)}
                      placeholder="@creator1&#10;@creator2&#10;@creator3"
                      rows={8}
                      className="w-full px-4 py-3 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal font-mono text-sm"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Paste handles separated by newlines, commas, or spaces
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        TikTok Handle *
                      </label>
                      <input
                        type="text"
                        value={newHandle}
                        onChange={(e) => setNewHandle(e.target.value)}
                        placeholder="@username"
                        className="w-full px-4 py-2.5 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        Display Name (optional)
                      </label>
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Creator's real name"
                        className="w-full px-4 py-2.5 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-text-primary mb-1.5">
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="e.g., Top performer, New Dec 2024"
                        className="w-full px-4 py-2.5 bg-titan-bg border border-titan-border rounded-lg text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 focus:border-accent-teal"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 border border-titan-border text-text-secondary rounded-lg text-sm font-medium hover:bg-titan-elevated transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 py-2.5 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {adding ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Add {bulkMode ? 'Creators' : 'Creator'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Creators List */}
        <div className="bg-titan-surface border border-titan-border rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="animate-spin text-accent-teal mx-auto mb-3" />
              <p className="text-sm text-text-muted">Loading creators...</p>
            </div>
          ) : creators.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="text-text-muted/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">No Linked Creators</h3>
              <p className="text-sm text-text-muted mb-4">
                Add your agency's creators to enable dashboard access
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent-teal text-white rounded-lg text-sm font-medium hover:bg-accent-teal/90 transition-colors"
              >
                <UserPlus size={16} />
                Add Your First Creator
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-titan-bg/50 text-xs text-text-muted uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">Handle</th>
                    <th className="px-6 py-3 text-left font-medium">Display Name</th>
                    <th className="px-6 py-3 text-left font-medium">Notes</th>
                    <th className="px-6 py-3 text-left font-medium">Status</th>
                    <th className="px-6 py-3 text-left font-medium">Linked</th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-titan-border">
                  {creators.map((creator) => (
                    <tr key={creator.id} className="hover:bg-titan-elevated/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-text-primary">
                        @{creator.tiktok_handle}
                      </td>
                      <td className="px-6 py-4 text-text-secondary">
                        {creator.display_name || '—'}
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs">
                        {creator.notes || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          creator.status === 'active' 
                            ? 'bg-accent-teal/10 text-accent-teal' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {creator.status === 'active' ? (
                            <CheckCircle size={10} />
                          ) : null}
                          {creator.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-text-muted text-xs">
                        {new Date(creator.linked_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRemove(creator.tiktok_handle)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                          title="Remove creator"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default AdminLinkedCreators;
