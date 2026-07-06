import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ENCRYPTED_VALUE_PREFIX = "kpenc:v1:";

export interface KeyEncryption {
  encrypt(value: string): string;
  decrypt(value: string): string;
}

export class PlainTextKeyEncryption implements KeyEncryption {
  encrypt(value: string): string {
    return value;
  }

  decrypt(value: string): string {
    if (isEncryptedValue(value)) {
      throw new Error("Encrypted API key value requires KEYPOOL_ENCRYPTION_KEY");
    }

    return value;
  }
}

export class AesGcmKeyEncryption implements KeyEncryption {
  private readonly key: Buffer;

  constructor(secret: string) {
    if (secret.trim().length === 0) {
      throw new Error("KEYPOOL_ENCRYPTION_KEY must not be empty");
    }

    this.key = createHash("sha256").update(secret).digest();
  }

  encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(value, "utf8"),
      cipher.final()
    ]);
    const tag = cipher.getAuthTag();

    return `${ENCRYPTED_VALUE_PREFIX}${encode(iv)}.${encode(tag)}.${encode(ciphertext)}`;
  }

  decrypt(value: string): string {
    if (!isEncryptedValue(value)) {
      return value;
    }

    const payload = value.slice(ENCRYPTED_VALUE_PREFIX.length);
    const parts = payload.split(".");
    const [iv, tag, ciphertext] = parts.map(decode);

    if (!iv || !tag || !ciphertext || parts.length !== 3) {
      throw new Error("Invalid encrypted API key value");
    }

    const decipher = createDecipheriv("aes-256-gcm", this.key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]).toString("utf8");
  }
}

export function createKeyEncryptionFromEnv(): KeyEncryption {
  const secret = process.env.KEYPOOL_ENCRYPTION_KEY;
  return secret ? new AesGcmKeyEncryption(secret) : new PlainTextKeyEncryption();
}

function isEncryptedValue(value: string): boolean {
  return value.startsWith(ENCRYPTED_VALUE_PREFIX);
}

function encode(value: Buffer): string {
  return value.toString("base64url");
}

function decode(value: string | undefined): Buffer | undefined {
  return value === undefined ? undefined : Buffer.from(value, "base64url");
}
