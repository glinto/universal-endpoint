import { getPayload, HTTPRequest } from '../../index.js';
import { FooRequest, FooResult } from './entities.js';
import { Logic } from './logic.js';

export class ServerLogic extends Logic {
	async foo(request: HTTPRequest<FooRequest>): Promise<FooResult> {
		return { message: `Hello, ${getPayload(request).name}! You are ${getPayload(request).age} years old` };
	}

	async primitiveNumber(request: HTTPRequest<number>): Promise<string> {
		return `You sent ${getPayload(request)}`;
	}

	async max(nums: HTTPRequest<number[]>): Promise<number> {
		return Math.max(...getPayload(nums));
	}

	async bar(): Promise<string> {
		return 'bar';
	}
}
