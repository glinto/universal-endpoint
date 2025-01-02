import { getGuardFor, hasPrimitiveProps } from '../../index.js';

export interface FooRequest {
	name: string;
	age: number;
}

export function isFooRequest(data: unknown): data is FooRequest {
	return hasPrimitiveProps(data, { name: 'string', age: 'number' });
}

export interface FooResult {
	message: string;
}

export const isFooResult = getGuardFor<FooResult>({ message: 'string' });

export interface Logic {
	foo(request: FooRequest): Promise<FooResult>;
}
