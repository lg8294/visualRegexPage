const __DEV__ = import.meta.env.DEV;

export default function (...args) {
    if (__DEV__) {
        return console.log('[vr]', ...args);
    }
}