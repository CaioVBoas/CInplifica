import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env';

const UPLOAD_ROOT = path.resolve(process.cwd(), env.uploadRoot);
const LISTING_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'listings');

const SUPPORTED_IMAGE_TYPES: Record<string, string[]> = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
};

export interface UploadImageInput {
  fileName?: string;
  mimeType?: string;
  data?: string;
}

export class UploadService {
  async saveListingImage(input: UploadImageInput) {
    const mimeType = input.mimeType?.trim().toLowerCase();
    const allowedExtensions = mimeType ? SUPPORTED_IMAGE_TYPES[mimeType] : undefined;

    if (!input.data || !mimeType || !allowedExtensions) {
      const allowedTypes = Object.keys(SUPPORTED_IMAGE_TYPES).join(', ');
      throw new Error(`Tipo de imagem inválido. Envie um arquivo ${allowedTypes}.`);
    }

    const originalExtension = this.getOriginalExtension(input.fileName);
    if (!originalExtension || !allowedExtensions.includes(originalExtension)) {
      throw new Error(`Extensão inválida para ${mimeType}.`);
    }

    const { dataMimeType, base64Data } = this.parseDataUrl(input.data);
    if (dataMimeType && dataMimeType !== mimeType) {
      throw new Error('Tipo de imagem não corresponde ao conteúdo enviado.');
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    if (fileBuffer.length === 0) {
      throw new Error('Arquivo de imagem vazio.');
    }

    if (fileBuffer.length > env.maxUploadBytes) {
      throw new Error(`A imagem deve ter no máximo ${Math.floor(env.maxUploadBytes / 1024 / 1024)} MB.`);
    }

    if (!this.matchesMagicBytes(mimeType, fileBuffer)) {
      throw new Error('Conteúdo do arquivo não corresponde a uma imagem válida.');
    }

    await fs.mkdir(LISTING_UPLOAD_DIR, { recursive: true });

    const safeBaseName = this.toSafeBaseName(input.fileName);
    const storageExtension = allowedExtensions[0];
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}.${storageExtension}`;
    const filePath = path.join(LISTING_UPLOAD_DIR, uniqueName);

    await fs.writeFile(filePath, fileBuffer);

    return {
      imageUrl: `/uploads/listings/${uniqueName}`,
      mimeType,
      size: fileBuffer.length,
    };
  }

  private parseDataUrl(data: string) {
    const match = data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return {
        dataMimeType: match[1].trim().toLowerCase(),
        base64Data: match[2],
      };
    }

    return {
      dataMimeType: undefined,
      base64Data: data,
    };
  }

  private matchesMagicBytes(mimeType: string, buffer: Buffer) {
    if (mimeType === 'image/jpeg') {
      return buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[buffer.length - 2] === 0xff && buffer[buffer.length - 1] === 0xd9;
    }

    if (mimeType === 'image/png') {
      return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }

    if (mimeType === 'image/webp') {
      return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
    }

    if (mimeType === 'image/gif') {
      const signature = buffer.subarray(0, 6).toString('ascii');
      return signature === 'GIF87a' || signature === 'GIF89a';
    }

    return false;
  }

  private getOriginalExtension(fileName?: string) {
    if (!fileName) return undefined;
    return path.extname(fileName).replace('.', '').toLowerCase();
  }

  private toSafeBaseName(fileName?: string) {
    const parsedName = fileName ? path.parse(fileName).name : 'imagem';
    const normalized = parsedName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();

    return normalized || 'imagem';
  }
}

export default new UploadService();
