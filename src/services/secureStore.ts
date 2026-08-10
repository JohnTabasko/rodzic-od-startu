// Secure local persistence backed by Keychain/Keystore when available.
// SecureStore has a small per-value limit, so persisted Zustand state is chunked.
// Web/unsupported environments fall back to AsyncStorage and are not encrypted.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHUNK_SIZE = 1_800;
const MAX_CHUNKS = 1_000;
const METADATA_SUFFIX = '_meta';
const LEGACY_COUNT_SUFFIX = '_n';

type Metadata = { version: string; count: number };

function key(name: string): string {
  return name.replace(/[^.A-Za-z0-9_-]/g, '_');
}

function parseCount(value: string | null): number {
  const count = Number.parseInt(value ?? '', 10);
  if (!Number.isInteger(count) || count < 1 || count > MAX_CHUNKS) {
    throw new Error('INVALID_SECURE_STORAGE_METADATA');
  }
  return count;
}

function parseMetadata(value: string | null): Metadata | null {
  if (!value) return null;
  const metadata = JSON.parse(value) as Partial<Metadata>;
  if (
    typeof metadata.version !== 'string' ||
    !/^[A-Za-z0-9_-]{1,64}$/.test(metadata.version) ||
    typeof metadata.count !== 'number' ||
    !Number.isInteger(metadata.count) ||
    metadata.count < 1 ||
    metadata.count > MAX_CHUNKS
  ) {
    throw new Error('INVALID_SECURE_STORAGE_METADATA');
  }
  return { version: metadata.version, count: metadata.count };
}

function chunkKey(prefix: string, version: string, index: number): string {
  return `${prefix}_${version}_${index}`;
}

function legacyChunkKey(prefix: string, index: number): string {
  return `${prefix}_${index}`;
}

async function readChunks(prefix: string, version: string, count: number): Promise<string | null> {
  const parts = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.getItemAsync(chunkKey(prefix, version, index)),
    ),
  );
  if (parts.some((part) => part === null)) return null;
  return parts.join('');
}

async function readLegacyChunks(prefix: string, count: number): Promise<string | null> {
  const parts = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      SecureStore.getItemAsync(legacyChunkKey(prefix, index)),
    ),
  );
  if (parts.some((part) => part === null)) return null;
  return parts.join('');
}

export const secureStorage = {
  async getItem(name: string): Promise<string | null> {
    try {
      const prefix = key(name);
      const metadata = parseMetadata(await SecureStore.getItemAsync(`${prefix}${METADATA_SUFFIX}`));
      if (metadata) return readChunks(prefix, metadata.version, metadata.count);

      // Read the old block format once and migrate it on the next write.
      const legacyMetadata = await SecureStore.getItemAsync(`${prefix}${LEGACY_COUNT_SUFFIX}`);
      if (legacyMetadata !== null) {
        const legacyCount = parseCount(legacyMetadata);
        return readLegacyChunks(prefix, legacyCount);
      }

      const legacy = await AsyncStorage.getItem(name);
      if (legacy !== null) await this.setItem(name, legacy);
      return legacy;
    } catch {
      return AsyncStorage.getItem(name);
    }
  },

  async setItem(name: string, value: string): Promise<void> {
    const prefix = key(name);
    try {
      const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
      if (count > MAX_CHUNKS) throw new Error('SECURE_STORAGE_VALUE_TOO_LARGE');

      const previousMetadata = parseMetadata(
        await SecureStore.getItemAsync(`${prefix}${METADATA_SUFFIX}`),
      );
      const previousLegacyValue = await SecureStore.getItemAsync(`${prefix}${LEGACY_COUNT_SUFFIX}`);
      const previousLegacyCount = previousMetadata
        ? 0
        : previousLegacyValue
          ? parseCount(previousLegacyValue)
          : 0;
      const version = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

      for (let index = 0; index < count; index += 1) {
        await SecureStore.setItemAsync(
          chunkKey(prefix, version, index),
          value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
        );
      }
      // Commit metadata last; readers continue using the previous generation if
      // the process stops while new chunks are being written.
      await SecureStore.setItemAsync(
        `${prefix}${METADATA_SUFFIX}`,
        JSON.stringify({ version, count }),
      );

      if (previousMetadata) {
        await Promise.all(
          Array.from({ length: previousMetadata.count }, (_, index) =>
            SecureStore.deleteItemAsync(chunkKey(prefix, previousMetadata.version, index)),
          ),
        );
      } else {
        await Promise.all(
          Array.from({ length: previousLegacyCount }, (_, index) =>
            SecureStore.deleteItemAsync(legacyChunkKey(prefix, index)),
          ),
        );
        await SecureStore.deleteItemAsync(`${prefix}${LEGACY_COUNT_SUFFIX}`);
      }
      await AsyncStorage.removeItem(name);
    } catch {
      // This fallback is required for web/Expo Go. It is intentionally not
      // described as encrypted; production mobile builds should provide SecureStore.
      await AsyncStorage.setItem(name, value);
    }
  },

  async removeItem(name: string): Promise<void> {
    const prefix = key(name);
    try {
      const metadata = parseMetadata(await SecureStore.getItemAsync(`${prefix}${METADATA_SUFFIX}`));
      if (metadata) {
        await Promise.all(
          Array.from({ length: metadata.count }, (_, index) =>
            SecureStore.deleteItemAsync(chunkKey(prefix, metadata.version, index)),
          ),
        );
      }
      const legacyCountValue = await SecureStore.getItemAsync(`${prefix}${LEGACY_COUNT_SUFFIX}`);
      if (legacyCountValue) {
        const legacyCount = parseCount(legacyCountValue);
        await Promise.all(
          Array.from({ length: legacyCount }, (_, index) =>
            SecureStore.deleteItemAsync(legacyChunkKey(prefix, index)),
          ),
        );
      }
      await SecureStore.deleteItemAsync(`${prefix}${METADATA_SUFFIX}`);
      await SecureStore.deleteItemAsync(`${prefix}${LEGACY_COUNT_SUFFIX}`);
    } catch {
      // Best-effort cleanup; AsyncStorage is still removed below.
    }
    await AsyncStorage.removeItem(name);
  },
};
