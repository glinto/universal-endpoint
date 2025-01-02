import { FooRequest, FooResult, Logic } from './base.js';

export class ServerLogic implements Logic {
	async foo(request: FooRequest): Promise<FooResult> {
		return { message: `Hello, ${request.name}! You are ${request.age} years old` };
	}
}
