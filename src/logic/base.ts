export interface FooRequest {
	name: string;
	age: number;
}

export function isFooRequest(value: unknown): value is FooRequest {
	const obj = value as FooRequest;
	return typeof obj.name === 'string' && typeof obj.age === 'number';
}

export interface FooResult {
	message: string;
}

export function isFooResult(value: unknown): value is FooResult {
	const obj = value as FooResult;
	return typeof obj.message === 'string';
}
