import { FooRequest, FooResult } from './entities.js';
import { Logic } from './logic.js';

export class ServerLogic extends Logic {
	async foo(request: FooRequest): Promise<FooResult> {
		return { message: `Hello, ${request.name}! You are ${request.age} years old` };
	}

	async primitiveNumber(request: number): Promise<string> {
		return `You sent ${request}`;
	}

	async max(nums: number[]): Promise<number> {
		return Math.max(...nums);
	}

	async bar(): Promise<string> {
		return 'bar';
	}
}
