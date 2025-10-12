
import { EventEmitter } from 'events';

// This is a simple event emitter that we can use to broadcast errors
// from anywhere in the application.
export const errorEmitter = new EventEmitter();
