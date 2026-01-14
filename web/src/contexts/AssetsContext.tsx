/**
 * AssetsContext - Global state for 3D assets
 *
 * Provides asset data from the database with automatic fetching and caching.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

const API_BASE = 'http://localhost:8000';

export interface Asset3D {
  asset_id: string;
  name: string;
  category: 'enemy' | 'boss' | 'item' | 'prop' | 'character';
  status: 'queued' | 'generating' | 'done' | 'error';
  priority: 'high' | 'medium' | 'low';
  source_image?: string;
  model_path?: string;
  texture_path?: string;
  notes?: string;
  vertex_count?: number;
  file_size_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetStats {
  total: number;
  queued: number;
  generating: number;
  done: number;
  error: number;
  by_category: Record<string, number>;
}

interface AssetsContextValue {
  assets: Asset3D[];
  stats: AssetStats;
  isLoading: boolean;
  error: string | null;
  refreshAssets: () => Promise<void>;
  getAsset: (assetId: string) => Asset3D | undefined;
  getAssetsByCategory: (category: Asset3D['category']) => Asset3D[];
  getAssetsByStatus: (status: Asset3D['status']) => Asset3D[];
  createAsset: (asset: Omit<Asset3D, 'created_at' | 'updated_at' | 'status'>) => Promise<Asset3D | null>;
  updateAsset: (assetId: string, updates: Partial<Asset3D>) => Promise<Asset3D | null>;
}

const AssetsContext = createContext<AssetsContextValue | null>(null);

export function useAssets() {
  const context = useContext(AssetsContext);
  if (!context) {
    throw new Error('useAssets must be used within an AssetsProvider');
  }
  return context;
}

interface AssetsProviderProps {
  children: ReactNode;
}

export function AssetsProvider({ children }: AssetsProviderProps) {
  const [assets, setAssets] = useState<Asset3D[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute stats from assets
  const stats = useMemo<AssetStats>(() => {
    const byStatus = {
      queued: 0,
      generating: 0,
      done: 0,
      error: 0,
    };
    const byCategory: Record<string, number> = {};

    for (const asset of assets) {
      byStatus[asset.status]++;
      byCategory[asset.category] = (byCategory[asset.category] || 0) + 1;
    }

    return {
      total: assets.length,
      ...byStatus,
      by_category: byCategory,
    };
  }, [assets]);

  // Fetch all assets from API
  const refreshAssets = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/assets3d`);
      if (response.ok) {
        const data = await response.json();
        setAssets(data);
      } else {
        throw new Error('Failed to fetch assets');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch assets';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a single asset by ID
  const getAsset = useCallback((assetId: string): Asset3D | undefined => {
    return assets.find(a => a.asset_id === assetId);
  }, [assets]);

  // Get assets by category
  const getAssetsByCategory = useCallback((category: Asset3D['category']): Asset3D[] => {
    return assets.filter(a => a.category === category);
  }, [assets]);

  // Get assets by status
  const getAssetsByStatus = useCallback((status: Asset3D['status']): Asset3D[] => {
    return assets.filter(a => a.status === status);
  }, [assets]);

  // Create a new asset
  const createAsset = useCallback(async (
    asset: Omit<Asset3D, 'created_at' | 'updated_at' | 'status'>
  ): Promise<Asset3D | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/assets3d`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create asset');
      }

      const newAsset = await response.json();
      setAssets(prev => [...prev, newAsset]);
      return newAsset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create asset';
      setError(message);
      return null;
    }
  }, []);

  // Update an existing asset
  const updateAsset = useCallback(async (
    assetId: string,
    updates: Partial<Asset3D>
  ): Promise<Asset3D | null> => {
    try {
      const response = await fetch(`${API_BASE}/api/assets3d/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update asset');
      }

      const updatedAsset = await response.json();
      setAssets(prev => prev.map(a => a.asset_id === assetId ? updatedAsset : a));
      return updatedAsset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update asset';
      setError(message);
      return null;
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  const value: AssetsContextValue = {
    assets,
    stats,
    isLoading,
    error,
    refreshAssets,
    getAsset,
    getAssetsByCategory,
    getAssetsByStatus,
    createAsset,
    updateAsset,
  };

  return (
    <AssetsContext.Provider value={value}>
      {children}
    </AssetsContext.Provider>
  );
}
