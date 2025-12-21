import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, Trash2, Plus } from 'lucide-react';
import weightTierService, { WeightTierMapping } from '../../services/weightTierService';
import { useToastContext } from '../../contexts/ToastContext';

interface WeightTierManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeightTierManagement: React.FC<WeightTierManagementProps> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useToastContext();
  const [mappings, setMappings] = useState<WeightTierMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTiers, setEditingTiers] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newTiers, setNewTiers] = useState<number[]>([]);

  // Available tier options
  const availableTiers = [1, 2, 3, 4];

  const fetchMappings = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await weightTierService.getWeightTierMappings();
      if (response.success) {
        setMappings(response.data.mappings);
      }
    } catch (error) {
      console.error('Error fetching mappings:', error);
      showError('Failed to fetch weight-tier mappings');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  // Fetch mappings on component mount
  useEffect(() => {
    if (isOpen) {
      fetchMappings();
    }
  }, [isOpen, fetchMappings]);

  const handleEdit = (mapping: WeightTierMapping) => {
    setEditingId(mapping.id);
    setEditingTiers([...mapping.available_tiers]);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTiers([]);
  };

  // Handle adding new weight-tier mapping
  const handleAddNew = () => {
    setShowAddForm(true);
    setNewWeight('');
    setNewTiers([]);
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewWeight('');
    setNewTiers([]);
  };

  const handleNewTierToggle = (tier: number) => {
    setNewTiers(prev => 
      prev.includes(tier) 
        ? prev.filter(t => t !== tier)
        : [...prev, tier].sort()
    );
  };

  const handleSaveNew = async () => {
    if (!newWeight.trim()) {
      showError('Please enter a weight');
      return;
    }

    if (newTiers.length === 0) {
      showError('Please select at least one tier');
      return;
    }

    setActionLoading('add-new');
    try {
      const response = await weightTierService.createWeightTierMapping({
        weight: newWeight.trim(),
        available_tiers: newTiers
      });
      
      const newMapping = response.data.mapping;

      setMappings(prev => [...prev, newMapping]);
      setShowAddForm(false);
      setNewWeight('');
      setNewTiers([]);
      showSuccess('New weight-tier mapping created successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to create new mapping');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTierToggle = (tier: number) => {
    setEditingTiers(prev => {
      if (prev.includes(tier)) {
        return prev.filter(t => t !== tier);
      } else {
        return [...prev, tier].sort();
      }
    });
  };

  const handleSave = async (id: number) => {
    if (editingTiers.length === 0) {
      showError('Please select at least one tier');
      return;
    }

    try {
      setActionLoading(`save-${id}`);
      const response = await weightTierService.updateWeightTierMapping(id, {
        available_tiers: editingTiers
      });

      if (response.success) {
        // Update the mapping in the local state
        setMappings(prev => prev.map(mapping => 
          mapping.id === id 
            ? { ...mapping, available_tiers: editingTiers, updated_at: new Date().toISOString() }
            : mapping
        ));
        setEditingId(null);
        setEditingTiers([]);
        showSuccess('Weight-tier mapping updated successfully');
      }
    } catch (error) {
      console.error('Error updating mapping:', error);
      showError('Failed to update weight-tier mapping');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number, weight: string) => {
    if (!window.confirm(`Are you sure you want to delete the mapping for "${weight}"?`)) {
      return;
    }

    try {
      setActionLoading(`delete-${id}`);
      const response = await weightTierService.deleteWeightTierMapping(id);

      if (response.success) {
        setMappings(prev => prev.filter(mapping => mapping.id !== id));
        showSuccess('Weight-tier mapping deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting mapping:', error);
      showError('Failed to delete weight-tier mapping');
    } finally {
      setActionLoading(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTiers = (tiers: number[]) => {
    return tiers.map(tier => `${tier} Tier`).join(', ');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/40 to-indigo-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] overflow-hidden shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold">Tier & Weight Management</h2>
              </div>
              <p className="text-blue-100 text-sm">
                Manage which tiers are available for each weight across all products
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-xl p-2 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                <span className="text-gray-600 font-medium">Loading weight-tier mappings...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-blue-900">{mappings.length}</p>
                      <p className="text-blue-700 text-sm font-medium">Total Weights</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-green-900">{mappings.filter(m => m.available_tiers.length > 1).length}</p>
                      <p className="text-green-700 text-sm font-medium">Multi-Tier Weights</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-purple-900">{mappings.reduce((sum, m) => sum + m.available_tiers.length, 0)}</p>
                      <p className="text-purple-700 text-sm font-medium">Total Tier Options</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-lg">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800">Weight-Tier Mappings</h3>
                      <p className="text-xs text-gray-600">Configure which cake tiers are available for each weight</p>
                    </div>
                    <button
                      onClick={handleAddNew}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add New Weight
                    </button>
                  </div>
                </div>
                
                {/* Add New Form */}
                {showAddForm && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">Add New Weight-Tier Mapping</h4>
                        <p className="text-xs text-gray-600">Create a new weight category with available tiers</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Weight Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Weight
                        </label>
                        <input
                          type="text"
                          value={newWeight}
                          onChange={(e) => setNewWeight(e.target.value)}
                          placeholder="e.g., 6 kg, 7.5 kg, 8kg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter the weight in any format</p>
                      </div>
                      
                      {/* Tier Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Available Tiers
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {availableTiers.map((tier) => (
                            <label
                              key={tier}
                              className="flex items-center space-x-1 cursor-pointer group"
                            >
                              <input
                                type="checkbox"
                                checked={newTiers.includes(tier)}
                                onChange={() => handleNewTierToggle(tier)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-green-600 focus:ring-green-500 focus:ring-1"
                              />
                              <span className="text-xs font-medium text-gray-700 group-hover:text-green-600 transition-colors">
                                {tier} Tier
                              </span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Select available tiers</p>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        onClick={handleCancelAdd}
                        className="px-3 py-1.5 border-2 border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNew}
                        disabled={actionLoading === 'add-new'}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {actionLoading === 'add-new' ? 'Creating...' : 'Create Mapping'}
                      </button>
                    </div>
                  </div>
                )}
                
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-slate-50 to-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Weight
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Available Tiers
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {mappings.map((mapping, index) => (
                      <tr key={mapping.id} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-xs">
                                {mapping.weight.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">
                                {mapping.weight}
                              </div>
                              <div className="text-xs text-gray-500">
                                Weight Category
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {editingId === mapping.id ? (
                            <div className="flex flex-wrap gap-2">
                              {availableTiers.map((tier) => (
                                <label
                                  key={tier}
                                  className="flex items-center space-x-1 cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    checked={editingTiers.includes(tier)}
                                    onChange={() => handleTierToggle(tier)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-1"
                                  />
                                  <span className="text-xs font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                    {tier} Tier
                                  </span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {mapping.available_tiers.map((tier) => (
                                <span
                                  key={tier}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                                >
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                                  {tier} Tier
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          {editingId === mapping.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleSave(mapping.id)}
                                disabled={actionLoading === `save-${mapping.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Save className="w-3 h-3 mr-1" />
                                {actionLoading === `save-${mapping.id}` ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="inline-flex items-center px-3 py-1.5 border-2 border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(mapping)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(mapping.id, mapping.weight)}
                                disabled={actionLoading === `delete-${mapping.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                {actionLoading === `delete-${mapping.id}` ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Configuration Summary</h4>
                    <p className="text-blue-700 text-xs">
                      <span className="text-lg font-bold text-blue-900">{mappings.length}</span> weight categories configured
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/60 rounded-lg p-3 border border-white/40">
                    <h5 className="font-semibold text-gray-800 text-xs mb-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      How it works
                    </h5>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Controls cake tiers for each weight</li>
                      <li>• Changes apply automatically</li>
                    </ul>
                  </div>
                  <div className="bg-white/60 rounded-lg p-3 border border-white/40">
                    <h5 className="font-semibold text-gray-800 text-xs mb-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      Customer Impact
                    </h5>
                    <ul className="text-xs text-gray-700 space-y-0.5">
                      <li>• Only enabled tiers show</li>
                      <li>• Real-time updates</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeightTierManagement;
