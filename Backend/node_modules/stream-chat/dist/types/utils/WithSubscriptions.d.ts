import type { Unsubscribe } from '../store';
/**
 * @private
 * Class to use as a template for subscribable entities.
 */
export declare abstract class WithSubscriptions {
    private unsubscribeFunctions;
    /**
     * Workaround for the missing TS keyword - ensures that inheritants
     * overriding `unregisterSubscriptions` call the base method and return
     * its unique symbol value.
     */
    protected static symbol: symbol;
    private refCount;
    abstract registerSubscriptions(): void;
    /**
     * Returns a boolean, provides information of whether `registerSubscriptions`
     * method has already been called for this instance.
     */
    get hasSubscriptions(): boolean;
    protected addUnsubscribeFunction(unsubscribeFunction: Unsubscribe): void;
    /**
     * Increments `refCount` by one and returns new value.
     */
    protected incrementRefCount(): number;
    /**
     * If you re-declare `unregisterSubscriptions` method within your class
     * make sure to run the original too.
     *
     * @example
     * ```ts
     * class T extends WithSubscriptions {
     *  ...
     *  public unregisterSubscriptions = () => {
     *    this.customThing();
     *    return super.unregisterSubscriptions();
     *  }
     * }
     * ```
     */
    unregisterSubscriptions(): typeof WithSubscriptions.symbol;
}
