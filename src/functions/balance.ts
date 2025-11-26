import { Address, Lamports } from "@solana/kit";
import { SWRSubscription } from "swr/subscription";
import { Connection } from "solana-kite";

/**
 * Watches for real-time changes to SOL balances using the new Kite watchLamportBalance function.
 * This replaces the previous custom subscription implementation with the official Kite method.
 *
 * The function uses Kite's watchLamportBalance which:
 * 1. Fetches the current balance immediately and calls the callback
 * 2. Subscribes to ongoing updates and calls the callback whenever the balance changes
 * 3. Returns a cleanup function to stop watching
 */
export function balanceSubscribe(
  connection: Connection,
  ...subscriptionArgs: Parameters<SWRSubscription<{ address: Address }, Lamports>>
) {
  const [{ address }, { next }] = subscriptionArgs;

  // Use the new Kite watchLamportBalance function
  const stopWatching = connection.watchLamportBalance(
    address,
    (error, balance) => {
      if (error) {
        next(error);
      } else if (balance !== null) {
        next(null /* err */, balance /* data */);
      }
      // If balance is null, we ignore the update (shouldn't happen in normal operation)
    }
  );

  // Return the cleanup function from watchLamportBalance
  return stopWatching;
}
