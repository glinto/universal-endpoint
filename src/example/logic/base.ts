import { getGuardFor } from '../../index.js';

export interface FooRequest {
	name: string;
	age: number;
}

export const isFooRequest = getGuardFor<FooRequest>({ name: 'string', age: 'number' });

export interface FooResult {
	message: string;
}

export const isFooResult = getGuardFor<FooResult>({ message: 'string' });

export interface Logic {
	foo(request: FooRequest): Promise<FooResult>;
}
