import { HTTPRequest, unwrapRequest } from '../../index.js';
import { FooRequest, FooResult } from './entities.js';
import { Logic } from './logic.js';

export class ServerLogic extends Logic {
	async foo(request: HTTPRequest<FooRequest>): Promise<FooResult> {
		const { payload } = unwrapRequest(request);
		return { message: `Hello, ${payload.name}! You are ${payload.age} years old` };
	}

	async primitiveNumber(request: HTTPRequest<number>): Promise<string> {
		return `You sent ${unwrapRequest(request)}`;
	}

	async max(nums: HTTPRequest<number[]>): Promise<number> {
		const { payload, headers } = unwrapRequest(nums);
		console.log('Payload:', payload);
		console.log('Headers:', headers);
		console.log('Authorization:', headers.Authorization);
		return Math.max(...payload);
	}

	async bar(): Promise<string> {
		return 'bar';
	}
}
