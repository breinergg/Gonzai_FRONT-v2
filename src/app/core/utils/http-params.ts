import { HttpParams } from '@angular/common/http';

/** Construye HttpParams omitiendo valores vacíos (null, undefined, '' y false). */
export function toParams(values: Record<string, string | number | boolean | null | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === '' || value === false) continue;
    params = params.set(key, String(value));
  }
  return params;
}
