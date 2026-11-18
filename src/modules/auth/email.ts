/**
 * Email delivery has moved to the Neon-managed authentication service.
 *
 * Momentum's application server must not send verification or password-reset
 * tokens from a second authentication authority. Configure email delivery
 * and Google OAuth in the Neon Auth dashboard.
 *
 * Kept as a no-op module for a non-destructive source migration. Remove
 * the file in a separate cleanup after the auth cutover is validated.
 */
export {};
