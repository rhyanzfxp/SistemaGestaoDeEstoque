import crypto from 'crypto';

/**
 * Gera um token criptograficamente aleatório de 32 bytes (64 chars hex).
 * Requisito 1.2
 */
export function gerarToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Retorna o hash SHA-256 do token em hexadecimal.
 * Requisitos 1.3, 2.3
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Retorna a data de expiração: agora + 3600 segundos (1 hora).
 * Requisito 3.1
 */
export function calcularExpiracao(): Date {
    return new Date(Date.now() + 3600 * 1000);
}
