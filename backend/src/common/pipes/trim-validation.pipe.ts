import { ArgumentMetadata, Injectable, ValidationPipe } from '@nestjs/common';

function trimDeep(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = trimDeep(value[i]);
    }
    return value;
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    !(value instanceof Date) &&
    !Buffer.isBuffer(value)
  ) {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      record[key] = trimDeep(record[key]);
    }
  }

  return value;
}

@Injectable()
export class TrimValidationPipe extends ValidationPipe {
  async transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): Promise<unknown> {
    const result: unknown = await super.transform(trimDeep(value), metadata);
    return result;
  }
}
