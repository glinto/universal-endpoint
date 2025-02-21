import { FooRequest, FooResult } from './entities.js';
import { Logic } from './logic.js';

export class ServerLogic extends Logic {
	async foo(request: FooRequest): Promise<FooResult> {
		return { message: `Hello, ${request.name}! You are ${request.age} years old` };
	}
}
