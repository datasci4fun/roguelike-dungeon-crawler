/**
 * Hook for fetching game constants from the API.
 *
 * Provides cached access to races, classes, and other game constants
 * that were migrated from static TypeScript files to PostgreSQL.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { gameConstantsApi } from '../services/api';
import type { RaceId, ClassId, RaceDefinition, ClassDefinition } from '../types';

// Cache duration in milliseconds (5 minutes - data is also cached server-side)
const CACHE_DURATION = 5 * 60 * 1000;

// In-memory cache shared across hook instances
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: {
  races: CacheEntry<RaceDefinition[]> | null;
  classes: CacheEntry<ClassDefinition[]> | null;
} = {
  races: null,
  classes: null,
};

function isCacheValid<T>(entry: CacheEntry<T> | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

/**
 * Transform API race response to frontend RaceDefinition format.
 */
function transformRace(apiRace: Awaited<ReturnType<typeof gameConstantsApi.getRaces>>[number]): RaceDefinition {
  return {
    id: apiRace.race_id.toUpperCase() as RaceId,
    name: apiRace.name,
    description: apiRace.description,
    hp_modifier: apiRace.hp_modifier,
    atk_modifier: apiRace.atk_modifier,
    def_modifier: apiRace.def_modifier,
    trait: apiRace.trait,
    trait_name: apiRace.trait_name,
    trait_description: apiRace.trait_description,
  };
}

/**
 * Transform API class response to frontend ClassDefinition format.
 */
function transformClass(apiClass: Awaited<ReturnType<typeof gameConstantsApi.getClasses>>[number]): ClassDefinition {
  return {
    id: apiClass.class_id.toUpperCase() as ClassId,
    name: apiClass.name,
    description: apiClass.description,
    hp_modifier: apiClass.hp_modifier,
    atk_modifier: apiClass.atk_modifier,
    def_modifier: apiClass.def_modifier,
    active_abilities: apiClass.active_abilities ?? [],
    passive_abilities: apiClass.passive_abilities ?? [],
  };
}

export interface GameConstantsState {
  races: Record<RaceId, RaceDefinition> | null;
  classes: Record<ClassId, ClassDefinition> | null;
  racesArray: RaceDefinition[];
  classesArray: ClassDefinition[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache game constants (races, classes).
 *
 * @example
 * const { races, classes, isLoading, error } = useGameConstants();
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 *
 * const race = races?.HUMAN;
 * const playerClass = classes?.WARRIOR;
 */
export function useGameConstants(): GameConstantsState {
  const [races, setRaces] = useState<Record<RaceId, RaceDefinition> | null>(null);
  const [classes, setClasses] = useState<Record<ClassId, ClassDefinition> | null>(null);
  const [racesArray, setRacesArray] = useState<RaceDefinition[]>([]);
  const [classesArray, setClassesArray] = useState<ClassDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  const fetchData = useCallback(async (force = false) => {
    // Prevent duplicate fetches
    if (fetchingRef.current) return;

    // Check cache first
    if (!force && isCacheValid(cache.races) && isCacheValid(cache.classes)) {
      const racesRecord = cache.races!.data.reduce((acc, race) => {
        acc[race.id] = race;
        return acc;
      }, {} as Record<RaceId, RaceDefinition>);

      const classesRecord = cache.classes!.data.reduce((acc, cls) => {
        acc[cls.id] = cls;
        return acc;
      }, {} as Record<ClassId, ClassDefinition>);

      setRaces(racesRecord);
      setClasses(classesRecord);
      setRacesArray(cache.races!.data);
      setClassesArray(cache.classes!.data);
      setIsLoading(false);
      return;
    }

    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch races and classes in parallel
      const [racesResponse, classesResponse] = await Promise.all([
        gameConstantsApi.getRaces(),
        gameConstantsApi.getClasses(),
      ]);

      // Transform API responses to frontend format
      const transformedRaces = racesResponse.map(transformRace);
      const transformedClasses = classesResponse.map(transformClass);

      // Update cache
      cache.races = { data: transformedRaces, timestamp: Date.now() };
      cache.classes = { data: transformedClasses, timestamp: Date.now() };

      // Build record objects for easy lookup
      const racesRecord = transformedRaces.reduce((acc, race) => {
        acc[race.id] = race;
        return acc;
      }, {} as Record<RaceId, RaceDefinition>);

      const classesRecord = transformedClasses.reduce((acc, cls) => {
        acc[cls.id] = cls;
        return acc;
      }, {} as Record<ClassId, ClassDefinition>);

      setRaces(racesRecord);
      setClasses(classesRecord);
      setRacesArray(transformedRaces);
      setClassesArray(transformedClasses);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load game constants';
      setError(message);
      console.error('Failed to fetch game constants:', err);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    races,
    classes,
    racesArray,
    classesArray,
    isLoading,
    error,
    refetch: () => fetchData(true),
  };
}

/**
 * Clear the in-memory cache (useful for testing or after cache invalidation).
 */
export function clearGameConstantsCache(): void {
  cache.races = null;
  cache.classes = null;
}
